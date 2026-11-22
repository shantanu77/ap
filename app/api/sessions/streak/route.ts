import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/utils";
import { getAuthenticatedKid } from "@/lib/kidAuth";

export async function GET(request: Request) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ streak: 0 });
  try {
    const settings = await prisma.boardSettings.findUnique({ where: { kidId: kid.id } });
    const activeDays = Array.isArray(settings?.activeDays) ? settings.activeDays.map(Number) : [0, 2, 4];
    const rows = await prisma.session.findMany({ where: { date: { lte: parseDate(date) }, status: "COMPLETE", dailyPlan: { is: { kidId: kid.id } } }, select: { date: true } });
    const completeDates = new Set(rows.map((row) => row.date.toISOString().slice(0, 10)));
    let streak = 0;
    const expected = parseDate(date);
    for (let offset = 0; offset < 45; offset += 1) {
      const key = expected.toISOString().slice(0, 10);
      if (activeDays.includes(expected.getUTCDay())) {
        if (!completeDates.has(key)) break;
        streak += 1;
      }
      expected.setUTCDate(expected.getUTCDate() - 1);
    }
    return NextResponse.json({ streak });
  } catch { return NextResponse.json({ streak: 0 }); }
}
