import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDailyInsights, defaultInsightsStart } from "@/lib/sessionInsights";

export async function GET() {
  try {
    const since = defaultInsightsStart();
    const sessions = await prisma.session.findMany({
      where: { date: { gte: since } },
      include: { phases: true, dailyPlan: true },
      orderBy: { date: "asc" },
    });
    const daily = buildDailyInsights(sessions, since);
    const attended = daily.filter((day) => day.status === "COMPLETE" || day.status === "PARTIAL").length;
    const absent = daily.filter((day) => day.absent).length;
    const incomplete = daily.filter((day) => day.incompleteTaskCount > 0 && !day.absent).length;
    const latestConcerns = daily
      .filter((day) => day.absent || day.incompleteTaskCount > 0)
      .slice(-10)
      .reverse();

    return NextResponse.json({
      windowDays: daily.length,
      attended,
      absent,
      incomplete,
      attendanceRate: daily.length > 0 ? Math.round((attended / daily.length) * 100) : 0,
      latestConcerns,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to build report" }, { status: 500 });
  }
}
