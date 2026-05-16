import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/utils";
import type { Phase } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  try {
    const body = await req.json();
    const { phase, ratings, completed, timeSpentSec } = body as {
      phase: Phase;
      ratings: object;
      completed: boolean;
      timeSpentSec?: number;
    };

    const date = parseDate(dateStr);
    const session = await prisma.session.findFirst({ where: { date } });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const phaseRating = await prisma.phaseRating.upsert({
      where: { sessionId_phase: { sessionId: session.id, phase } },
      create: { sessionId: session.id, phase, ratings, completed, timeSpentSec },
      update: { ratings, completed, timeSpentSec },
    });

    // Check if all 6 phases are completed → mark session COMPLETE
    const allPhases = await prisma.phaseRating.findMany({
      where: { sessionId: session.id, completed: true },
    });
    if (allPhases.length >= 6) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "COMPLETE", completedAt: new Date() },
      });
    }

    return NextResponse.json(phaseRating);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save phase rating" }, { status: 500 });
  }
}
