import { NextResponse } from "next/server";
import {
  findExploration,
  renameExploration,
  softDeleteExploration,
  toExplorationDTO,
  touchExploration,
} from "@/lib/genius";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const exploration = await findExploration(id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const updated = await touchExploration(id);
  return NextResponse.json(toExplorationDTO(updated));
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const exploration = await findExploration(id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const body = (await request.json()) as { title?: unknown };
  const title = String(body.title ?? "").replace(/[<>]/g, "").trim().slice(0, 160);
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  const updated = await renameExploration(id, title);
  return NextResponse.json(toExplorationDTO(updated));
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const exploration = await findExploration(id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  await softDeleteExploration(id);
  return NextResponse.json({ success: true });
}
