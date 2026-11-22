import { NextResponse } from "next/server";
import { getOrCreatePlan, generatePlansUpTo, regeneratePlanForDate } from "@/lib/generate";
import { todayString } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return (
    req.headers.get("x-cron-secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

// POST /api/generate — generate today's plan (cron calls this at 8PM)
// POST /api/generate?until=2027-02-27 — bulk generate all plans until date
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const until = url.searchParams.get("until");
  const force = url.searchParams.get("force") === "1";
  const date = url.searchParams.get("date") ?? todayString();

  try {
    const learners = await prisma.kidProfile.findMany({ where: { emailVerifiedAt: { not: null } }, select: { id: true, name: true, grade: true } });
    if (until) {
      const results = await Promise.all(learners.map((learner) => generatePlansUpTo(until, learner)));
      return NextResponse.json({ results: results.flat() });
    }

    const plans = await Promise.all(learners.map((learner) => force
      ? regeneratePlanForDate(date, learner)
      : getOrCreatePlan(date, learner)));

    return NextResponse.json({ success: true, date, planIds: plans.map((plan) => plan.id), learnerCount: plans.length, regenerated: force });
  } catch (err) {
    console.error("Generation failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
