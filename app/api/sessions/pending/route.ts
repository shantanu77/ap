import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPendingWork } from "@/lib/sessionInsights";
import { parseDate, todayString } from "@/lib/utils";
import { getAuthenticatedKid } from "@/lib/kidAuth";

export async function GET() {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  try {
    const sessions = await prisma.session.findMany({
      where: { date: { lt: parseDate(todayString()) }, dailyPlan: { is: { kidId: kid.id } } },
      include: { phases: true, dailyPlan: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(buildPendingWork(sessions, parseDate(todayString())));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch pending work" }, { status: 500 });
  }
}
