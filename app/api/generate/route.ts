import { NextResponse } from "next/server";
import { getOrCreatePlan, generatePlansUpTo } from "@/lib/generate";
import { todayString } from "@/lib/utils";

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

  try {
    if (until) {
      const results = await generatePlansUpTo(until);
      return NextResponse.json({ results });
    }

    const plan = await getOrCreatePlan(todayString());
    return NextResponse.json({ success: true, date: todayString(), planId: plan.id });
  } catch (err) {
    console.error("Generation failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
