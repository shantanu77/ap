import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGmailSmtpEmail } from "@/lib/email";
import { getParentNotificationConfig } from "@/lib/parentConfig";
import { parseDate, todayString } from "@/lib/utils";

// Invoke this endpoint once per minute from a scheduler. It sends at the saved local time.
export async function GET(request: Request) {
  const secret = process.env.BOARD_REMINDER_SECRET || process.env.OPENAI_API_KEY;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const date = todayString();
  try {
    const settings = await prisma.boardSettings.findUnique({ where: { id: "board" } });
    if (!settings?.remindersEnabled || !settings.reminderEmail) return NextResponse.json({ sent: false, reason: "disabled" });
    if (settings.lastReminderDate === date) return NextResponse.json({ sent: false, reason: "already-sent" });
    const dayNumber = parseDate(date).getUTCDay();
    const days = Array.isArray(settings.activeDays) ? settings.activeDays.map(Number) : [];
    if (!days.includes(dayNumber)) return NextResponse.json({ sent: false, reason: "not-scheduled" });
    const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
    if (now !== settings.reminderTime) return NextResponse.json({ sent: false, reason: "not-reminder-time" });
    const session = await prisma.session.findFirst({ where: { date: parseDate(date), status: "COMPLETE" } });
    if (session) return NextResponse.json({ sent: false, reason: "already-completed" });
    const email = getParentNotificationConfig();
    if (!email.senderEmail || !email.senderPassword) return NextResponse.json({ error: "Reminder email sender is not configured." }, { status: 503 });
    await sendGmailSmtpEmail({ from: email.senderEmail, password: email.senderPassword, to: [settings.reminderEmail], subject: "🌟 Your Study Quest is ready, Aashvath!", text: `Hi Aashvath!\n\nIt is time for your Study Quest. Pick one task, focus, and keep going step by step. You can do it! 📚✨\n\nYour study days: Sunday, Tuesday, and Thursday.\n` });
    await prisma.boardSettings.update({ where: { id: "board" }, data: { lastReminderDate: date } });
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Study board reminder failed:", error);
    return NextResponse.json({ error: "Could not send study reminder." }, { status: 500 });
  }
}
