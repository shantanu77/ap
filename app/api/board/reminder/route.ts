import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendGmailSmtpEmail } from "@/lib/email";
import { getParentNotificationConfig } from "@/lib/parentConfig";
import { parseDate } from "@/lib/utils";

// Invoke this endpoint once per minute from a scheduler. It sends at the saved local time.
export async function GET(request: Request) {
  const secret = process.env.BOARD_REMINDER_SECRET || process.env.CRON_SECRET || process.env.OPENAI_API_KEY;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settingsList = await prisma.boardSettings.findMany({
      where: { remindersEnabled: true, reminderEmail: { not: null } },
      include: { kid: true },
    });
    const email = getParentNotificationConfig();
    if (!email.senderEmail || !email.senderPassword) return NextResponse.json({ error: "Reminder email sender is not configured." }, { status: 503 });
    let sent = 0;
    const outcomes: Array<{ kidId: string; sent: boolean; reason: string }> = [];
    for (const settings of settingsList) {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: settings.kid.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
      const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
      const date = `${part("year")}-${part("month")}-${part("day")}`;
      const localTime = `${part("hour")}:${part("minute")}`;
      const days = Array.isArray(settings.activeDays) ? settings.activeDays.map(Number) : [];
      if (settings.lastReminderDate === date) { outcomes.push({ kidId: settings.kidId, sent: false, reason: "already-sent" }); continue; }
      if (localTime !== settings.reminderTime) { outcomes.push({ kidId: settings.kidId, sent: false, reason: "not-reminder-time" }); continue; }
      if (!days.includes(parseDate(date).getUTCDay())) { outcomes.push({ kidId: settings.kidId, sent: false, reason: "not-scheduled" }); continue; }
      const session = await prisma.session.findFirst({ where: { date: parseDate(date), status: "COMPLETE", dailyPlan: { is: { kidId: settings.kidId } } } });
      if (session) { outcomes.push({ kidId: settings.kidId, sent: false, reason: "already-completed" }); continue; }
      const recipient = settings.kid.email || settings.reminderEmail;
      if (!recipient) { outcomes.push({ kidId: settings.kidId, sent: false, reason: "no-email" }); continue; }
      await sendGmailSmtpEmail({ from: email.senderFromEmail, authUser: email.senderEmail, password: email.senderPassword, to: [recipient], subject: `🌟 ${settings.kid.name}'s Study Quest is ready!`, text: `Hi ${settings.kid.name}!\n\nIt is time for your Study Quest. Pick one task, focus, and keep going step by step. You can do it! 📚✨\n` });
      await prisma.boardSettings.update({ where: { id: settings.id }, data: { lastReminderDate: date } });
      sent += 1;
      outcomes.push({ kidId: settings.kidId, sent: true, reason: "sent" });
    }
    return NextResponse.json({ sent, outcomes });
  } catch (error) {
    console.error("Study board reminder failed:", error);
    return NextResponse.json({ error: "Could not send study reminder." }, { status: 500 });
  }
}
