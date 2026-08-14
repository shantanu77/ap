import { NextResponse } from "next/server";
import {
  canonicalizeTopic,
  cleanTopic,
  createContent,
  displayTitleForTopic,
  toStudyLevel,
  toGeniusSubject,
} from "@/lib/geniusContent";
import { createExplorationRecord, generateIntroduction, toExplorationDTO } from "@/lib/genius";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic?: unknown; level?: unknown; subject?: unknown };
    const topic = cleanTopic(body.topic);
    const requestedLevel = toStudyLevel(body.level);
    const subject = toGeniusSubject(body.subject);
    const level = subject === "math" && requestedLevel === 5 ? 6 : requestedLevel;
    if (topic.length < 3) {
      return NextResponse.json({ error: `Tell me a ${subject} topic to explore.` }, { status: 400 });
    }

    const introduction = await generateIntroduction(topic, level, subject);
    const content = createContent(introduction);
    const exploration = await createExplorationRecord({
      subject,
      canonicalTopic: canonicalizeTopic(topic),
      displayTitle: introduction.title || displayTitleForTopic(topic, subject),
      defaultLevel: level,
      content,
    });

    return NextResponse.json(toExplorationDTO(exploration), { status: 201 });
  } catch (error) {
    console.error("Could not create Genius Corner exploration:", error);
    return NextResponse.json({ error: "The idea lab had a wobble. Please try again. 🧪" }, { status: 500 });
  }
}
