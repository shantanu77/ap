import { NextResponse } from "next/server";
import {
  contentFromJson,
  findExploration,
  generateExpansion,
  toExplorationDTO,
  updateExplorationContent,
} from "@/lib/genius";
import { cleanTopic, toStudyLevel } from "@/lib/geniusContent";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const exploration = await findExploration(id);
    if (!exploration) {
      return NextResponse.json({ error: "Exploration not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      parentNodeId?: unknown;
      label?: unknown;
      intent?: unknown;
      level?: unknown;
      question?: unknown;
    };
    const content = contentFromJson(exploration.content);
    const parentNodeId = String(body.parentNodeId ?? content.activeNodeId);
    const parentNode = content.nodes.find((node) => node.id === parentNodeId);
    if (!parentNode) {
      return NextResponse.json({ error: "The starting idea could not be found." }, { status: 400 });
    }

    const question = cleanTopic(body.question);
    const label = question || cleanTopic(body.label) || "Explore further";
    const intent = question
      ? `Answer this Chemistry question in context: ${question}`
      : cleanTopic(body.intent) || `Explain ${label}`;
    const level = toStudyLevel(body.level ?? exploration.defaultLevel);

    const nextNode = await generateExpansion({
      topic: exploration.displayTitle,
      level,
      parentNode,
      label,
      intent,
      nodeType: question ? "QUESTION" : "READ_MORE",
      ancestorTitles: content.nodes.map((node) => node.title).slice(-8),
    });
    const updatedContent = {
      ...content,
      activeNodeId: nextNode.id,
      nodes: [...content.nodes, nextNode],
    };

    const updated = await updateExplorationContent(id, updatedContent);
    return NextResponse.json(toExplorationDTO(updated));
  } catch (error) {
    console.error("Could not expand Genius Corner topic:", error);
    return NextResponse.json({ error: "That idea did not finish forming. Try it once more. 💡" }, { status: 500 });
  }
}
