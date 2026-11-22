import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedKid } from "@/lib/kidAuth";

const DEFAULT_SETTINGS = { activeDays: [0, 2, 4], remindersEnabled: false, reminderTime: "18:00" };

export async function GET() {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  try {
    const settings = await prisma.boardSettings.upsert({
      where: { kidId: kid.id },
      create: { id: crypto.randomUUID(), kidId: kid.id, ...DEFAULT_SETTINGS, reminderEmail: kid.email },
      update: {},
    });
    return NextResponse.json({ ...settings, reminderEmail: kid.email });
  } catch (error) {
    console.error("Board settings could not be loaded:", error);
    return NextResponse.json({ error: "Could not load board settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  try {
    const body = await request.json();
    const activeDays: number[] = Array.isArray(body.activeDays)
      ? Array.from(new Set<number>((body.activeDays as unknown[]).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)))
      : [];
    const reminderTime = typeof body.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.reminderTime) ? body.reminderTime : "18:00";
    if (!activeDays.length) return NextResponse.json({ error: "Choose at least one board day." }, { status: 400 });
    if (body.remindersEnabled && !kid.email) return NextResponse.json({ error: "A verified account email is required for reminders." }, { status: 400 });
    const settings = await prisma.boardSettings.upsert({
      where: { kidId: kid.id },
      create: { id: crypto.randomUUID(), kidId: kid.id, ...DEFAULT_SETTINGS, activeDays, remindersEnabled: Boolean(body.remindersEnabled), reminderEmail: kid.email, reminderTime },
      update: { activeDays, remindersEnabled: Boolean(body.remindersEnabled), reminderEmail: kid.email, reminderTime },
    });
    return NextResponse.json({ ...settings, reminderEmail: kid.email });
  } catch (error) {
    console.error("Board settings could not be saved:", error);
    return NextResponse.json({ error: "Could not save board settings." }, { status: 500 });
  }
}
