import { NextResponse } from "next/server";
import { contentFromJson, listSavedExplorations } from "@/lib/genius";
import type { SavedTopicSummary } from "@/types/genius";
import { toGeniusSubject } from "@/lib/geniusContent";

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const records = await listSavedExplorations(search);

  const topics: SavedTopicSummary[] = records.flatMap((record) => {
    if (!record.savedSnapshot || !record.savedAt) return [];
    const content = contentFromJson(record.savedSnapshot);
    const hero = content.nodes[0]?.blocks.find((block) => block.type === "hero");
    return [{
      id: record.id,
      subject: toGeniusSubject(record.subject),
      canonicalTopic: record.canonicalTopic,
      displayTitle: record.displayTitle,
      defaultLevel: (record.defaultLevel >= 5 && record.defaultLevel <= 8 ? record.defaultLevel : 6) as 5 | 6 | 7 | 8,
      nodeCount: content.nodes.length,
      savedAt: record.savedAt.toISOString(),
      lastOpenedAt: record.lastOpenedAt.toISOString(),
      emoji: hero?.type === "hero" ? hero.emoji : record.subject === "physics" ? "🚀" : record.subject === "biology" ? "🧬" : record.subject === "math" ? "➗" : "⚗️",
      hasSimulation: content.nodes.some((node) => node.blocks.some((block) => block.type === "simulation")),
    }];
  });

  return NextResponse.json(topics);
}
