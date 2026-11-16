import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = { id: "board", activeDays: [0, 2, 4], remindersEnabled: false, reminderEmail: null, reminderTime: "18:00" };

export async function GET() {
  try {
    const settings = await prisma.boardSettings.upsert({ where: { id: "board" }, create: DEFAULT_SETTINGS, update: {} });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Board settings could not be loaded:", error);
    return NextResponse.json({ error: "Could not load board settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const activeDays = Array.isArray(body.activeDays) ? [...new Set(body.activeDays.map(Number).filter((day: number) => Number.isInteger(day) && day >= 0 && day <= 6))] : [];
    const reminderEmail = typeof body.reminderEmail === "string" ? body.reminderEmail.trim() : "";
    const reminderTime = typeof body.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.reminderTime) ? body.reminderTime : "18:00";
    if (!activeDays.length) return NextResponse.json({ error: "Choose at least one board day." }, { status: 400 });
    if (body.remindersEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reminderEmail)) return NextResponse.json({ error: "Enter a valid reminder email." }, { status: 400 });
    const settings = await prisma.boardSettings.upsert({ where: { id: "board" }, create: { ...DEFAULT_SETTINGS, activeDays, remindersEnabled: Boolean(body.remindersEnabled), reminderEmail: reminderEmail || null, reminderTime }, update: { activeDays, remindersEnabled: Boolean(body.remindersEnabled), reminderEmail: reminderEmail || null, reminderTime } });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Board settings could not be saved:", error);
    return NextResponse.json({ error: "Could not save board settings." }, { status: 500 });
  }
}
