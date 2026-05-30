import { NextResponse } from "next/server";
import { getOrCreatePlan, normalizeDailyContent, regeneratePlanForDate } from "@/lib/generate";
import { todayString, toDateString, parseDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
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

export async function POST() {
  const dateStr = todayString();

  try {
    const existing = await prisma.dailyPlan.findUnique({
      where: { date: parseDate(dateStr) },
      include: { session: { include: { phases: true } } },
    });

    if (existing?.session?.startedAt || (existing?.session?.phases.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Today's session has already started; plan was not regenerated." },
        { status: 409 }
      );
    }

    const plan = await regeneratePlanForDate(dateStr);
    return NextResponse.json({
      ...plan,
      content: normalizeDailyContent(toDateString(plan.date), plan.content as unknown as DailyContent),
      editedContent: plan.editedContent
        ? normalizeDailyContent(
            toDateString(plan.date),
            plan.editedContent as unknown as DailyContent
          )
        : plan.editedContent,
      regenerated: true,
    });
  } catch (err) {
    console.error("Failed to regenerate today's plan:", err);
    return NextResponse.json({ error: "Failed to regenerate today's plan" }, { status: 500 });
  }
}
