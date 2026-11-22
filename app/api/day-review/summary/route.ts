import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getAuthenticatedKid } from "@/lib/kidAuth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface DaySummaryResult {
  summary: string;
  rating: number;
  feedback: string;
  betterSummary: string;
  speakingTips: string[];
  fillerWords: string[];
}

function clampRating(value: unknown): number {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 1;
  return Math.min(5, Math.max(1, Math.round(rating * 10) / 10));
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];
}

function parseSummary(raw: string | null, isSchoolDay: boolean, learnerName: string): DaySummaryResult {
  if (!raw) {
    return {
      summary: "No day summary was returned.",
      rating: 1,
      feedback: "Try again and speak for a few complete sentences.",
      betterSummary: isSchoolDay
        ? "At school today I learned one useful thing, handled one challenge, and chose one action for my next school day."
        : "Today I enjoyed one activity, noticed something useful, handled one challenge, and chose a helpful next step.",
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
        : `${learnerName} shared a short summary of the day.`,
      rating: clampRating(parsed.rating),
      feedback:
        typeof parsed.feedback === "string" && parsed.feedback.trim()
          ? parsed.feedback.trim()
          : "Good start. Add one specific example and speak in complete sentences.",
      betterSummary:
        typeof parsed.betterSummary === "string" && parsed.betterSummary.trim()
          ? parsed.betterSummary.trim()
          : isSchoolDay
            ? "At school today I can name one thing I learned, one challenge, and one action for my next school day."
            : "Today I can name one thing I did, one useful discovery, one important choice, and my next helpful step.",
      speakingTips: stringList(parsed.speakingTips),
      fillerWords: stringList(parsed.fillerWords),
    };
  } catch {
    return {
      summary: "Could not parse the day summary review.",
      rating: 1,
      feedback: "Try recording again with two or three complete sentences.",
      betterSummary: isSchoolDay
        ? "At school today I learned something useful, faced one challenge, and chose an action for my next school day."
        : "Today I did something enjoyable, noticed something useful, handled one challenge, and chose my next helpful step.",
      speakingTips: ["Use complete sentences.", "Avoid long pauses and filler words."],
      fillerWords: [],
    };
  }
}

export async function POST(req: Request) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const dayType = String(formData.get("dayType") ?? "school_day");
    const contextLabel = String(formData.get("contextLabel") ?? "School-day reflection");
    const isSchoolDay = dayType === "school_day";

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Audio recording is required" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
      response_format: "json",
      prompt: isSchoolDay
        ? `A Grade ${kid.grade} student named ${kid.name} is describing their school day using five parts: the school day, one learning, a challenge, schoolwork status, and their next-school-day action.`
        : `A Grade ${kid.grade} student named ${kid.name} is giving a ${dayType} reflection about their activities, one discovery, a challenge or choice, responsibility and rest, and one useful next step. Do not assume they attended school today.`,
    });
    const transcript = transcription.text.trim();

    if (!transcript) {
      return NextResponse.json({
        transcript,
        summary: "No spoken day summary was detected.",
        rating: 1,
        feedback: "Record again and say what happened, how you felt, and one thing you learned.",
        betterSummary: isSchoolDay
          ? "At school today I learned one useful thing, handled one challenge, and chose one action for my next school day."
          : "Today I enjoyed one activity, noticed something useful, handled one challenge, and chose a helpful next step.",
        speakingTips: ["Speak loudly enough for the microphone.", "Use three complete sentences."],
        fillerWords: [],
      });
    }

    const review = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: isSchoolDay
            ? `You coach a Grade ${kid.grade} student on spoken school-day reviews. Return only JSON with keys summary:string, rating:number from 1 to 5 using up to one decimal place, feedback:string, betterSummary:string, speakingTips:string[], fillerWords:string[]. Check five anchors: what happened at school, one specific learning, one challenge and response, completed or unfinished schoolwork, and one concrete action for the next school day. Rate clarity, specificity, reflection, sentence structure, and filler words such as um, uh, like, you know. Name one missing anchor when applicable. Be kind, direct, and practical.`
            : `You coach a Grade ${kid.grade} student on spoken weekend or holiday reflections. Return only JSON with keys summary:string, rating:number from 1 to 5 using up to one decimal place, feedback:string, betterSummary:string, speakingTips:string[], fillerWords:string[]. Check five day-off anchors: what the learner did, one thing learned/noticed/read/watched/practised, one challenge or important choice, a balance of responsibility and rest, and one useful next step. Never require or infer school attendance, classes, homework, or today's schoolwork. Rate clarity, specificity, reflection, sentence structure, and filler words such as um, uh, like, you know. Name one missing day-off anchor when applicable. Be kind, direct, and practical.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            learner: kid.name,
            context: contextLabel,
            task: "Review this spoken day summary and show how he can say it better.",
            transcript,
          }),
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const result = parseSummary(review.choices[0].message.content, isSchoolDay, kid.name);
    return NextResponse.json({ transcript, ...result });
  } catch (err) {
    console.error("Day review summary failed:", err);
    return NextResponse.json({ error: "Failed to review day summary" }, { status: 500 });
  }
}
