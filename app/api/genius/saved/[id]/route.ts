import { NextResponse } from "next/server";
import { contentFromJson, findExploration, touchExploration } from "@/lib/genius";
import { toGeniusSubject } from "@/lib/geniusContent";
import { getAuthenticatedKid } from "@/lib/kidAuth";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  const { id } = await context.params;
  const exploration = await findExploration(id, kid.id);
  if (!exploration?.savedSnapshot || !exploration.savedAt) {
    return NextResponse.json({ error: "Saved topic not found." }, { status: 404 });
  }

  await touchExploration(id, kid.id);

  return NextResponse.json({
    id: exploration.id,
    subject: toGeniusSubject(exploration.subject),
    canonicalTopic: exploration.canonicalTopic,
    displayTitle: exploration.displayTitle,
    defaultLevel: exploration.defaultLevel,
    content: contentFromJson(exploration.savedSnapshot),
    savedAt: exploration.savedAt.toISOString(),
  });
}
