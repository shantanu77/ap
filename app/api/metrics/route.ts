import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toDateString } from "@/lib/utils";
import { subDays } from "date-fns";

export async function GET() {
  try {
    const since90 = subDays(new Date(), 90);

    const sessions = await prisma.session.findMany({
      where: { date: { gte: since90 } },
      include: { phases: true },
      orderBy: { date: "asc" },
    });

    const daily = sessions.map((s) => {
      const phases = s.phases;
      const writing = phases.find((p) => p.phase === "WRITING");
      const language = phases.find((p) => p.phase === "LANGUAGE");
      const workQuality = phases.find((p) => p.phase === "WORK_QUALITY");
      const readAloud = phases.find((p) => p.phase === "READ_ALOUD");

      const wr = writing?.ratings as Record<string, number> | null;
      const lr = language?.ratings as Record<string, number> | null;
      const wqr = workQuality?.ratings as Record<string, unknown> | null;
      const rr = readAloud?.ratings as Record<string, number | boolean> | null;

      return {
        date: toDateString(s.date),
        status: s.status,
        writingLines: wr?.linesWritten ?? null,
        writingLegibility: wr?.legibility ?? null,
        writingEffort: wr?.effort ?? null,
        languageConfidence: lr?.confidence ?? null,
        homeworkCompleteness: wqr?.homeworkCompleteness ?? null,
        discipline: wqr?.discipline ?? null,
        shortcutUsage: wqr?.shortcutUsage ?? null,
        readingCompleted: rr?.completed ?? null,
        readingComprehension: rr?.comprehension ?? null,
      };
    });

    // Streak calculation
    let streak = 0;
    const sorted = [...sessions].reverse();
    for (const s of sorted) {
      if (s.status === "COMPLETE" || s.status === "PARTIAL") streak++;
      else break;
    }

    // Attendance
    const totalDays = sessions.length;
    const completedDays = sessions.filter(
      (s) => s.status === "COMPLETE" || s.status === "PARTIAL"
    ).length;

    return NextResponse.json({
      daily,
      streak,
      totalSessions: totalDays,
      completedSessions: completedDays,
      attendanceRate: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to compute metrics" }, { status: 500 });
  }
}
