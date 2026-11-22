import { NextResponse } from "next/server";
import { getAuthenticatedKid } from "@/lib/kidAuth";
import {
  findExploration,
  renameExploration,
  softDeleteExploration,
  toExplorationDTO,
  touchExploration,
} from "@/lib/genius";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const updated = await touchExploration(id, kid.id);
  return NextResponse.json(toExplorationDTO(updated));
}

export async function PATCH(request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const body = (await request.json()) as { title?: unknown };
  const title = String(body.title ?? "").replace(/[<>]/g, "").trim().slice(0, 160);
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  const updated = await renameExploration(id, kid.id, title);
  return NextResponse.json(toExplorationDTO(updated));
}

export async function DELETE(_request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  await softDeleteExploration(id, kid.id);
  return NextResponse.json({ success: true });
}
