import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate, toDateString } from "@/lib/utils";
import { normalizeDailyContent } from "@/lib/generate";
import type { DailyContent } from "@/types";
import { getAuthenticatedKid } from "@/lib/kidAuth";

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { date: dateStr } = await params;
  try {
    const plan = await prisma.dailyPlan.findUnique({
      where: { kidId_date: { kidId: kid.id, date: parseDate(dateStr) } },
      include: { session: { include: { phases: true } } },
    });
    if (!plan) return NextResponse.json({ error: "No plan found" }, { status: 404 });
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
  } catch {
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { date: dateStr } = await params;
  try {
    const body = await req.json();
    const plan = await prisma.dailyPlan.update({
      where: { kidId_date: { kidId: kid.id, date: parseDate(dateStr) } },
      data: { editedContent: body.content, edited: true },
    });
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
