import { NextResponse } from "next/server";
import {
  cleanTopic,
  createContent,
  displayTitleForTopic,
  toStudyLevel,
  toGeniusSubject,
} from "@/lib/geniusContent";
import { cacheLesson, createExplorationRecord, findCachedLesson, generateIntroduction, toExplorationDTO } from "@/lib/genius";
import { researchGeniusTopic, resolveGeniusTopic } from "@/lib/geniusResearch";
import type { GeniusContent } from "@/types/genius";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic?: unknown; level?: unknown; subject?: unknown };
    const topic = cleanTopic(body.topic);
    const requestedLevel = toStudyLevel(body.level);
    const subject = toGeniusSubject(body.subject);
    const level = requestedLevel;
    if (topic.length < 3) {
      return NextResponse.json({ error: `Tell me a ${subject} topic to explore.` }, { status: 400 });
    }

    const plan = await resolveGeniusTopic(topic, subject);
    const cached = await findCachedLesson(subject, plan.canonicalTopic);
    let content: GeniusContent;
    if (cached) {
      const cachedContent = JSON.parse(typeof cached.content === "string" ? cached.content : JSON.stringify(cached.content));
      const cachedRoot = cachedContent.nodes?.[0];
      if (!cachedRoot) throw new Error("Cached Genius lesson has no introduction node.");
      const introduction = { ...cachedRoot, id: crypto.randomUUID(), parentNodeId: null, studyLevel: level, createdAt: new Date().toISOString() };
      content = createContent(introduction, cachedContent.curriculumResearch);
    } else {
      const research = await researchGeniusTopic({ plan, subject, level });
      const introduction = await generateIntroduction(plan.title, level, subject, research, plan.focus);
      const curriculumResearch = { ...research, canonicalTopic: plan.canonicalTopic, resolvedTitle: plan.title };
      content = createContent(introduction, curriculumResearch);
      await cacheLesson({ subject, canonicalTopic: plan.canonicalTopic, displayTitle: plan.title, content });
    }
    const exploration = await createExplorationRecord({
      subject,
      canonicalTopic: plan.canonicalTopic,
      displayTitle: content.curriculumResearch?.resolvedTitle || cached?.displayTitle || displayTitleForTopic(topic, subject),
      defaultLevel: level,
      content,
    });

    return NextResponse.json(toExplorationDTO(exploration), { status: 201 });
  } catch (error) {
    console.error("Could not create Genius Corner exploration:", error);
    return NextResponse.json({ error: "The idea lab had a wobble. Please try again. 🧪" }, { status: 500 });
  }
}
