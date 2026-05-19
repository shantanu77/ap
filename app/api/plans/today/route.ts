import { NextResponse } from "next/server";
import { getOrCreatePlan, normalizeDailyContent } from "@/lib/generate";
import { todayString, toDateString } from "@/lib/utils";
import type { DailyContent } from "@/types";

export async function GET() {
  try {
    const plan = await getOrCreatePlan(todayString());
    return NextResponse.json({
      ...plan,
      content: normalizeDailyContent(toDateString(plan.date), plan.content as unknown as DailyContent),
      editedContent: plan.editedContent
        ? normalizeDailyContent(
            toDateString(plan.date),
            plan.editedContent as unknown as DailyContent
          )
        : plan.editedContent,
    });
  } catch (err) {
    console.error("Failed to get/create today's plan:", err);
    return NextResponse.json({ error: "Failed to load today's plan" }, { status: 500 });
  }
}
