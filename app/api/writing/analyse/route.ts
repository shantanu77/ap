import OpenAI from "openai";
import { NextResponse } from "next/server";
import type { WritingMistake, WritingRating } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface VisionResult {
  transcript?: unknown;
  linesWritten?: unknown;
  legibility?: unknown;
  effort?: unknown;
  contentAccuracyScore?: unknown;
  spellingScore?: unknown;
  grammarStructureScore?: unknown;
  legibilityScore?: unknown;
  spellingMistakes?: unknown;
  grammarMistakes?: unknown;
  structureFeedback?: unknown;
  legibilityFeedback?: unknown;
  strengths?: unknown;
  summary?: unknown;
}

function clamp(value: unknown, min: number, max: number): number {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
}

function strings(value: unknown, limit = 8): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, limit)
    : [];
}

function mistakes(value: unknown): WritingMistake[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        written: String(record.written ?? "").trim(),
        correction: String(record.correction ?? "").trim(),
        explanation: String(record.explanation ?? "").trim(),
      };
    })
    .filter((item) => item.written && item.correction && item.explanation)
    .slice(0, 15);
}

function parseVisionResult(raw: string | null): VisionResult {
  if (!raw) throw new Error("The vision model returned an empty assessment.");
  return JSON.parse(raw) as VisionResult;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const photo = formData.get("photo");
    const prompt = String(formData.get("prompt") ?? "").trim();
    const linesRequired = clamp(formData.get("linesRequired"), 1, 10);
    const timeSpentSec = clamp(formData.get("timeSpentSec"), 0, 4 * 60 * 60);
    const timeLimitSec = clamp(formData.get("timeLimitSec"), 60, 60 * 60);

    if (!(photo instanceof File) || !prompt) {
      return NextResponse.json({ error: "A writing photo and the original prompt are required." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(photo.type)) {
      return NextResponse.json({ error: "Please upload a JPEG, PNG, or WebP photo." }, { status: 415 });
    }
    if (photo.size === 0 || photo.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "The prepared photo must be smaller than 2 MB." }, { status: 413 });
    }

    const base64 = Buffer.from(await photo.arrayBuffer()).toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a meticulous, encouraging handwriting assessor for a Grade 6 CBSE student with dysgraphia. Inspect only what is visibly written in the uploaded page. The image has been converted to high-contrast grayscale to make handwriting easier to inspect. Compare it line by line with the supplied copy-writing prompt. Use [unclear] rather than inventing an unreadable word.

Evaluation priorities are spelling, grammar and sentence structure, and legibility. Find every visible mistake, including omitted or substituted words, capitalization, punctuation, agreement, word order, incomplete sentences, and spelling. Do not count the same issue twice. For EACH mistake, quote the exact written fragment, give the exact correction, then explain the applicable rule, why the original is wrong in this sentence, and why the correction works. Never give vague feedback such as "improve grammar". Separate true language mistakes from handwriting that is merely hard to read. A source sentence that was copied correctly must not be penalized. Do not demand or recommend a rewrite.

Return JSON only with: transcript:string preserving line breaks (use [unclear] where necessary), linesWritten:integer, legibility:integer 1-5, effort:integer 1-5, contentAccuracyScore:integer 0-20, spellingScore:integer 0-25, grammarStructureScore:integer 0-30, legibilityScore:integer 0-25, spellingMistakes:array of {written,correction,explanation}, grammarMistakes:array of {written,correction,explanation}, structureFeedback:string[], legibilityFeedback:string[], strengths:string[], summary:string. Legibility feedback must cite specific observed letter formation, spacing, alignment, size consistency, or ambiguous words and explain its reading impact. Scores total 100 before any separate time deduction. Be evidence-based, thorough, and supportive.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: JSON.stringify({ task: "Assess the photographed writing", originalPrompt: prompt, linesRequired }) },
            { type: "image_url", image_url: { url: `data:${photo.type};base64,${base64}`, detail: "high" } },
          ],
        },
      ],
    });

    const result = parseVisionResult(response.choices[0].message.content);
    const baseScore =
      clamp(result.contentAccuracyScore, 0, 20) +
      clamp(result.spellingScore, 0, 25) +
      clamp(result.grammarStructureScore, 0, 30) +
      clamp(result.legibilityScore, 0, 25);
    const overtimeSec = Math.max(0, timeSpentSec - timeLimitSec);
    const timeDeduction = Math.min(20, Math.ceil(overtimeSec / 60));
    const rating: WritingRating = {
      linesWritten: clamp(result.linesWritten, 0, Math.max(10, linesRequired)),
      legibility: clamp(result.legibility, 1, 5) as WritingRating["legibility"],
      effort: clamp(result.effort, 1, 5) as WritingRating["effort"],
      score: Math.max(0, baseScore - timeDeduction),
      baseScore,
      timeLimitSec,
      timeSpentSec,
      overtimeSec,
      timeDeduction,
      transcript: String(result.transcript ?? "").trim(),
      summary: String(result.summary ?? "Writing assessed from the uploaded page.").trim(),
      spellingMistakes: mistakes(result.spellingMistakes),
      grammarMistakes: mistakes(result.grammarMistakes),
      structureFeedback: strings(result.structureFeedback),
      legibilityFeedback: strings(result.legibilityFeedback),
      strengths: strings(result.strengths),
      assessedAt: new Date().toISOString(),
    };

    return NextResponse.json(rating);
  } catch (err) {
    console.error("Writing photo analysis failed:", err);
    return NextResponse.json({ error: "Failed to analyse the writing photo. Try a clearer photo." }, { status: 500 });
  }
}
