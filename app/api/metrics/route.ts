import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildDailyInsights, defaultInsightsStart } from "@/lib/sessionInsights";

export async function GET() {
  try {
    const since90 = defaultInsightsStart();

    const sessions = await prisma.session.findMany({
      where: { date: { gte: since90 } },
      include: { phases: true, dailyPlan: true },
      orderBy: { date: "asc" },
    });

    const daily = buildDailyInsights(sessions, since90);

    // Streak calculation
    let streak = 0;
    const sorted = [...daily].reverse();
    for (const day of sorted) {
      if (day.status === "COMPLETE" || day.status === "PARTIAL") streak++;
      else break;
    }

    // Attendance
    const totalDays = daily.length;
    const attendedDays = daily.filter((day) => day.status === "COMPLETE" || day.status === "PARTIAL").length;
    const absentDays = daily.filter((day) => day.absent).length;
    const incompleteTaskDays = daily.filter((day) => day.incompleteTaskCount > 0 && !day.absent).length;

    return NextResponse.json({
      daily,
      streak,
      totalSessions: totalDays,
      completedSessions: attendedDays,
      attendedSessions: attendedDays,
      absentSessions: absentDays,
      incompleteTaskDays,
      attendanceRate: totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to compute metrics" }, { status: 500 });
  }
}
