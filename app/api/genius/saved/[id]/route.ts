import { NextResponse } from "next/server";
import { contentFromJson, findExploration, touchExploration } from "@/lib/genius";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const exploration = await findExploration(id);
  if (!exploration?.savedSnapshot || !exploration.savedAt) {
    return NextResponse.json({ error: "Saved topic not found." }, { status: 404 });
  }

  await touchExploration(id);

  return NextResponse.json({
    id: exploration.id,
    subject: "chemistry",
    canonicalTopic: exploration.canonicalTopic,
    displayTitle: exploration.displayTitle,
    defaultLevel: exploration.defaultLevel,
    content: contentFromJson(exploration.savedSnapshot),
    savedAt: exploration.savedAt.toISOString(),
  });
}
