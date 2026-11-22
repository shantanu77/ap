import { NextResponse } from "next/server";
import { getOrCreatePlan, normalizeDailyContent, regeneratePlanForDate } from "@/lib/generate";
import { todayString, toDateString, parseDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { DailyContent } from "@/types";
import { getAuthenticatedKid } from "@/lib/kidAuth";

export async function GET() {
  try {
    const kid = await getAuthenticatedKid();
    if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    const plan = await getOrCreatePlan(todayString(), kid);
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
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const dateStr = todayString();

  try {
    const existing = await prisma.dailyPlan.findUnique({
      where: { kidId_date: { kidId: kid.id, date: parseDate(dateStr) } },
      include: { session: { include: { phases: true } } },
    });

    if (existing?.session?.startedAt || (existing?.session?.phases.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Today's session has already started; plan was not regenerated." },
        { status: 409 }
      );
    }

    const plan = await regeneratePlanForDate(dateStr, kid);
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
