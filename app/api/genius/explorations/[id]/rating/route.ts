import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedKid } from "@/lib/kidAuth";
import { contentFromJson, findExploration } from "@/lib/genius";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  const ratings = await prisma.geniusRating.findMany({ where: { kidId: kid.id, explorationId: id }, select: { nodeId: true, rating: true, feedback: true } });
  return NextResponse.json({ ratings: Object.fromEntries(ratings.map((item) => [item.nodeId, { rating: item.rating, feedback: item.feedback ?? "" }])) });
}

export async function PUT(request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  try {
    const body = await request.json();
    const nodeId = String(body.nodeId ?? "").slice(0, 191);
    const rating = Number(body.rating);
    const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 500) : "";
    const content = contentFromJson(exploration.content);
    if (!content.nodes.some((node) => node.id === nodeId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Choose a lesson card and a rating from 1 to 5." }, { status: 400 });
    }
    const saved = await prisma.geniusRating.upsert({
      where: { kidId_explorationId_nodeId: { kidId: kid.id, explorationId: id, nodeId } },
      create: { kidId: kid.id, explorationId: id, nodeId, rating, feedback: feedback || null },
      update: { rating, feedback: feedback || null },
    });
    return NextResponse.json({ rating: saved.rating, feedback: saved.feedback ?? "" });
  } catch {
    return NextResponse.json({ error: "Could not save your rating. Please try again." }, { status: 500 });
  }
}
