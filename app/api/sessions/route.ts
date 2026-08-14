import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate, toDateString, todayString } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const plans = await prisma.dailyPlan.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: parseDate(from) } : {}),
                ...(to ? { lte: parseDate(to) } : {}),
              },
            }
          : {}),
      },
      include: { session: { include: { phases: true } } },
      orderBy: { date: "desc" },
    });
    const today = todayString();
    const days = plans.map((plan) => {
      const date = toDateString(plan.date);
      const session = plan.session;
      const completedPhases = session?.phases.filter((phase) => phase.completed).length ?? 0;
      const untouched = date < today && session?.status !== "MISSED" && (!session || completedPhases === 0);
      return {
        id: session?.id ?? `plan-${plan.id}`,
        date,
        status: untouched ? "NOT_ATTEMPTED" : session?.status ?? "PENDING",
        phases: session?.phases.map((phase) => ({ phase: phase.phase, completed: phase.completed })) ?? [],
        scheduled: true,
      };
    });
    return NextResponse.json(days);
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
