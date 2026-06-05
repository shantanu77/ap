import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPendingWork } from "@/lib/sessionInsights";
import { parseDate, todayString } from "@/lib/utils";

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      where: { date: { lt: parseDate(todayString()) } },
      include: { phases: true, dailyPlan: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(buildPendingWork(sessions, parseDate(todayString())));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch pending work" }, { status: 500 });
  }
}
