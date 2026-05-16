import { NextResponse } from "next/server";
import { getOrCreatePlan } from "@/lib/generate";
import { todayString } from "@/lib/utils";

export async function GET() {
  try {
    const plan = await getOrCreatePlan(todayString());
    return NextResponse.json(plan);
  } catch (err) {
    console.error("Failed to get/create today's plan:", err);
    return NextResponse.json({ error: "Failed to load today's plan" }, { status: 500 });
  }
}
