import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizeSpokenSentence(value: string): string[] {
  return value
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/gu, "")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Speech checking is not configured." }, { status: 500 });
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const sentence = String(form.get("sentence") ?? "").trim();
    const language = String(form.get("language") ?? "").trim();
    if (!(audio instanceof File) || !sentence) return NextResponse.json({ error: "Audio and the practice sentence are required." }, { status: 400 });
    const languageName = language === "sanskrit" ? "Sanskrit" : language === "hindi" ? "Hindi" : "Hindi or Sanskrit";
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      ...(language === "hindi" || language === "sanskrit" ? { language: language === "sanskrit" ? "sa" : "hi" } : {}),
      prompt: `The speaker is reading this ${languageName} sentence aloud. Transcribe only the sounds actually spoken, verbatim, using Devanagari script only. Never translate, normalize, autocorrect, or replace a spoken word with the expected word. Similar-sounding Hindi words can have different meanings: फूल (phūl, flower) and फल (phal, fruit) are different; write the one that was actually spoken. Expected sentence for pronunciation context only (do not copy it unless spoken): ${sentence}`,
    });
    const transcript = transcription.text.trim();
    if (!transcript) return NextResponse.json({ transcript, correct: false, feedback: "I could not hear the sentence. Please try again." });
    if (/[\u0600-\u06FF]/u.test(transcript)) {
      return NextResponse.json({ transcript: "", correct: false, feedback: "I could not transcribe that clearly in Devanagari. Please record the sentence again." });
    }
    // This is a reading-aloud check, so semantic similarity is not enough:
    // every target word must be present in the transcript in the same order.
    const expectedWords = normalizeSpokenSentence(sentence);
    const spokenWords = normalizeSpokenSentence(transcript);
    const correct = expectedWords.length > 0
      && expectedWords.length === spokenWords.length
      && expectedWords.every((word, index) => word === spokenWords[index]);
    return NextResponse.json({
      transcript,
      correct,
      feedback: correct
        ? "Great job! You read the sentence correctly."
        : "Some words differ from the sentence. Listen once more and try reading the exact words shown.",
    });
  } catch (error) {
    console.error("Language speech check failed:", error);
    return NextResponse.json({ error: "Could not check the recording. Please try again." }, { status: 500 });
  }
}
