import { NextResponse } from "next/server";
import {
  contentFromJson,
  cacheDeepDive,
  embedDeepDive,
  findSimilarDeepDive,
  findExploration,
  generateExpansion,
  toExplorationDTO,
  updateExplorationContent,
} from "@/lib/genius";
import { cleanQuestion, cleanTopic, toDeepDiveLevel, toGeniusSubject, toStudyLevel } from "@/lib/geniusContent";
import { getAuthenticatedKid } from "@/lib/kidAuth";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  try {
    const { id } = await context.params;
    const exploration = await findExploration(id, kid.id);
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

    const question = cleanQuestion(body.question);
    const subject = toGeniusSubject(exploration.subject);
    const label = cleanTopic(body.label) || question || "Explore further";
    const intent = question
      ? `Answer this ${subject} question in context: ${question}`
      : cleanTopic(body.intent) || `Explain ${label}`;
    const baseLevel = toStudyLevel(body.level ?? exploration.defaultLevel);
    const level = toDeepDiveLevel(body.level ?? baseLevel, baseLevel);
    const queryText = (question || intent || label).slice(0, 1000);
    const embedding = await embedDeepDive(subject, exploration.canonicalTopic, queryText).catch((error) => {
      console.error("Genius deep-dive embedding failed; generating without cache:", error);
      return null;
    });
    const similar = embedding
      ? await findSimilarDeepDive({ subject, canonicalTopic: exploration.canonicalTopic, level, embedding })
      : null;
    const nextNode = similar
      ? {
          ...(similar.record.node as Awaited<ReturnType<typeof generateExpansion>>),
          id: crypto.randomUUID(),
          parentNodeId: parentNode.id,
          promptLabel: label,
          studyLevel: level,
          createdAt: new Date().toISOString(),
        }
      : await generateExpansion({
          topic: exploration.displayTitle,
          level,
          parentNode,
          label,
          intent,
          nodeType: question ? "QUESTION" : "READ_MORE",
          ancestorTitles: content.nodes.map((node) => node.title).slice(-8),
          subject,
          curriculumResearch: content.curriculumResearch,
        });
    if (!similar && embedding) {
      await cacheDeepDive({ subject, canonicalTopic: exploration.canonicalTopic, level, queryText, embedding, node: nextNode });
    }
    const updatedContent = {
      ...content,
      activeNodeId: nextNode.id,
      nodes: [...content.nodes, nextNode],
    };

    const updated = await updateExplorationContent(id, kid.id, updatedContent);
    return NextResponse.json(toExplorationDTO(updated));
  } catch (error) {
    console.error("Could not expand Genius Corner topic:", error);
    return NextResponse.json({ error: "That idea did not finish forming. Try it once more. 💡" }, { status: 500 });
  }
}
