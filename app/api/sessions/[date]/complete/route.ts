import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate, todayString } from "@/lib/utils";

export async function POST(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  try {
    const body = await req.json();
    const date = parseDate(dateStr);
    const completedLate = date.getTime() < parseDate(todayString()).getTime();

    const session = await prisma.session.findFirst({ where: { date } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: {
        status: "COMPLETE",
        completedAt: new Date(),
        lateCompletedAt: completedLate ? new Date() : null,
        notes: body.notes,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to complete session" }, { status: 500 });
  }
}
