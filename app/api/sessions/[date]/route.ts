import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/utils";
import { getOrCreatePlan } from "@/lib/generate";

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  try {
    const session = await prisma.session.findFirst({
      where: { date: parseDate(dateStr) },
      include: { phases: true, dailyPlan: true },
    });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// Start or get session for a date
export async function POST(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date: dateStr } = await params;
  try {
    const date = parseDate(dateStr);
    const plan = await getOrCreatePlan(dateStr);

    const existing = await prisma.session.findFirst({ where: { date } });
    if (existing) return NextResponse.json(existing);

    const session = await prisma.session.create({
      data: {
        date,
        dailyPlanId: plan.id,
        startedAt: new Date(),
        status: "PARTIAL",
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
