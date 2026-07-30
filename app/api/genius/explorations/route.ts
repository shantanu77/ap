import { NextResponse } from "next/server";
import {
  canonicalizeTopic,
  cleanTopic,
  createContent,
  displayTitleForTopic,
  toStudyLevel,
} from "@/lib/geniusContent";
import { createExplorationRecord, generateIntroduction, toExplorationDTO } from "@/lib/genius";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { topic?: unknown; level?: unknown };
    const topic = cleanTopic(body.topic);
    const level = toStudyLevel(body.level);
    if (topic.length < 3) {
      return NextResponse.json({ error: "Tell me a Chemistry topic to explore." }, { status: 400 });
    }

    const introduction = await generateIntroduction(topic, level);
    const content = createContent(introduction);
    const exploration = await createExplorationRecord({
      subject: "chemistry",
      canonicalTopic: canonicalizeTopic(topic),
      displayTitle: introduction.title || displayTitleForTopic(topic),
      defaultLevel: level,
      content,
    });

    return NextResponse.json(toExplorationDTO(exploration), { status: 201 });
  } catch (error) {
    console.error("Could not create Genius Corner exploration:", error);
    return NextResponse.json({ error: "The idea lab had a wobble. Please try again. 🧪" }, { status: 500 });
  }
}
