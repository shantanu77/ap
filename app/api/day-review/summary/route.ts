import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DaySummaryResult {
  summary: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  betterSummary: string;
  speakingTips: string[];
  fillerWords: string[];
}

function clampRating(value: unknown): 1 | 2 | 3 | 4 | 5 {
  const rating = Math.round(Number(value));
  if (rating <= 1) return 1;
  if (rating >= 5) return 5;
  return rating as 1 | 2 | 3 | 4 | 5;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];
}

function parseSummary(raw: string | null): DaySummaryResult {
  if (!raw) {
    return {
      summary: "No day summary was returned.",
      rating: 1,
      feedback: "Try again and speak for a few complete sentences.",
      betterSummary: "Today was interesting because I learned one new thing and noticed one thing I can improve tomorrow.",
      speakingTips: ["Speak in full sentences.", "Say one clear example from the day."],
      fillerWords: [],
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DaySummaryResult>;
    return {
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : "Ashvath shared a short summary of his day.",
      rating: clampRating(parsed.rating),
      feedback:
        typeof parsed.feedback === "string" && parsed.feedback.trim()
          ? parsed.feedback.trim()
          : "Good start. Add one specific example and speak in complete sentences.",
      betterSummary:
        typeof parsed.betterSummary === "string" && parsed.betterSummary.trim()
          ? parsed.betterSummary.trim()
          : "Today went well because I can name one thing I learned, one challenge, and one thing I will improve tomorrow.",
      speakingTips: stringList(parsed.speakingTips),
      fillerWords: stringList(parsed.fillerWords),
    };
  } catch {
    return {
      summary: "Could not parse the day summary review.",
      rating: 1,
      feedback: "Try recording again with two or three complete sentences.",
      betterSummary: "Today I learned something useful, faced one challenge, and know what I want to improve tomorrow.",
      speakingTips: ["Use complete sentences.", "Avoid long pauses and filler words."],
      fillerWords: [],
    };
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio recording is required" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
      response_format: "json",
      prompt: "A grade 6 student named Ashvath is describing how his school day went.",
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      return NextResponse.json({
        transcript,
        summary: "No spoken day summary was detected.",
        rating: 1,
        feedback: "Record again and say what happened, how you felt, and one thing you learned.",
        betterSummary: "Today I felt focused because I completed my work. One hard part was staying patient, and tomorrow I will ask questions sooner.",
        speakingTips: ["Speak loudly enough for the microphone.", "Use three complete sentences."],
        fillerWords: [],
      });
    }

    const review = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You coach a Grade 6 student on spoken day summaries. Return only JSON with keys summary:string, rating:number from 1 to 5, feedback:string, betterSummary:string, speakingTips:string[], fillerWords:string[]. Rate clarity, specificity, reflection, sentence structure, and filler words such as um, uh, like, you know. Be kind, direct, and practical.",
        },
        {
          role: "user",
          content: JSON.stringify({
            learner: "Ashvath",
            task: "Review this spoken day summary and show how he can say it better.",
            transcript,
          }),
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const result = parseSummary(review.choices[0].message.content);
    return NextResponse.json({ transcript, ...result });
  } catch (err) {
    console.error("Day review summary failed:", err);
    return NextResponse.json({ error: "Failed to review day summary" }, { status: 500 });
  }
}
