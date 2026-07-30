import { NextResponse } from "next/server";
import {
  contentFromJson,
  findExploration,
  saveExplorationSnapshot,
  toExplorationDTO,
} from "@/lib/genius";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  const exploration = await findExploration(id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const content = contentFromJson(exploration.content);
  const updated = await saveExplorationSnapshot(id, content);
  return NextResponse.json(toExplorationDTO(updated));
}
