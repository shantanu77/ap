import { NextResponse } from "next/server";
import {
  contentFromJson,
  findExploration,
  saveExplorationSnapshot,
  toExplorationDTO,
} from "@/lib/genius";
import { getAuthenticatedKid } from "@/lib/kidAuth";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration) {
    return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
  }

  const content = contentFromJson(exploration.content);
  const updated = await saveExplorationSnapshot(id, kid.id, content);
  return NextResponse.json(toExplorationDTO(updated));
}
