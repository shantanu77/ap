import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDate } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const sessions = await prisma.session.findMany({
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
      include: { phases: true, dailyPlan: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
