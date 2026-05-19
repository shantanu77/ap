import OpenAI from "openai";
import { prisma } from "./prisma";
import { formatDisplayDate, getTopicForDate, getLanguageForDate, parseDate, todayString } from "./utils";
import type { DailyContent } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function splitIntoSentences(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function chunkWordsIntoLines(text: string, lineCount: number): string[] {
  const words = normalizeWhitespace(text).split(" ").filter(Boolean);
  if (words.length === 0) return Array.from({ length: lineCount }, () => "");

  const targetSize = Math.ceil(words.length / lineCount);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += targetSize) {
    lines.push(words.slice(i, i + targetSize).join(" "));
  }
  return lines;
}

function ensureExactWritingLines(prompt: string, lineCount: number): string {
  const normalized = normalizeWhitespace(prompt);
  const sentenceLines = splitIntoSentences(normalized);
  let lines =
    sentenceLines.length >= lineCount
      ? sentenceLines.slice(0, lineCount)
      : sentenceLines;

  if (lines.length === 1) {
    const clauseSplit = lines[0]
      .split(/[,;:]\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (clauseSplit.length >= lineCount) {
      lines = clauseSplit.slice(0, lineCount);
    }
  }

  if (lines.length < lineCount) {
    lines = chunkWordsIntoLines(normalized, lineCount);
  }

  lines = lines
    .slice(0, lineCount)
    .map((line) => line.trim().replace(/[.?!]$/, ""))
    .map((line) => (line ? `${line}.` : ""))
    .filter(Boolean);

  while (lines.length < lineCount) {
    lines.push("Write this line neatly.");
  }

  return lines.join("\n");
}

function dedupeQuestions(questions: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const question of questions) {
    const normalized = normalizeWhitespace(question).toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(normalizeWhitespace(question));
  }

  return unique;
}

function buildRecentReadingNotes(
  recentPlans: Array<{ content: unknown; editedContent: unknown | null }>
): string {
  const recentReadings = recentPlans
    .map((plan) => (plan.editedContent ?? plan.content) as Partial<DailyContent>)
    .map((content) => content.reading)
    .filter(Boolean)
    .slice(0, 5)
    .map((reading, index) => {
      const title = reading?.title?.trim();
      const topic = reading?.topic?.trim();
      return `${index + 1}. ${title || "Untitled"}${topic ? ` (${topic})` : ""}`;
    });

  if (recentReadings.length === 0) {
    return "No recent reading titles are available.";
  }

  return recentReadings.join("\n");
}

export function normalizeDailyContent(dateStr: string, content: DailyContent): DailyContent {
  const linesRequired =
    Number.isFinite(content.writing?.lines_required) && content.writing.lines_required > 0
      ? Math.min(5, Math.max(3, Math.round(content.writing.lines_required)))
      : 3;

  const uniqueQuestions = dedupeQuestions(content.reading.comprehension_questions ?? []);
  while (uniqueQuestions.length < 3) {
    uniqueQuestions.push(`What is one important idea from the passage in question ${uniqueQuestions.length + 1}?`);
  }

  return {
    ...content,
    date: dateStr,
    reading: {
      ...content.reading,
      title: normalizeWhitespace(content.reading.title),
      topic: normalizeWhitespace(content.reading.topic),
      passage: normalizeWhitespace(content.reading.passage),
      comprehension_questions: uniqueQuestions.slice(0, 3),
    },
    language: {
      ...content.language,
      lesson_title: normalizeWhitespace(content.language.lesson_title),
      content: content.language.content.trim(),
      practice_task: normalizeWhitespace(content.language.practice_task),
      remember_tip: normalizeWhitespace(content.language.remember_tip),
    },
    writing: {
      ...content.writing,
      lines_required: linesRequired,
      prompt: ensureExactWritingLines(content.writing.prompt, linesRequired),
      success_criteria: [
        `All ${linesRequired} lines are attempted`,
        "Letters are legible",
        "No skipped words",
      ],
    },
    science_hook: normalizeWhitespace(content.science_hook),
    ethics_reflection: normalizeWhitespace(content.ethics_reflection),
    next_day_tip: normalizeWhitespace(content.next_day_tip),
  };
}

async function buildPrompt(dateStr: string): Promise<string> {
  const topic = getTopicForDate(dateStr);
  const language = getLanguageForDate(dateStr);
  const fullDate = formatDisplayDate(dateStr);
  const recentPlans = await prisma.dailyPlan.findMany({
    where: {
      date: {
        lt: parseDate(dateStr),
      },
    },
    orderBy: { date: "desc" },
    take: 5,
    select: {
      content: true,
      editedContent: true,
    },
  });
  const recentReadingNotes = buildRecentReadingNotes(recentPlans);

  const languageInstructions =
    language === "review"
      ? `Language focus: Sunday review day. Give a light revision covering 3 Hindi words and 3 Sanskrit words the student may have seen earlier this week. Keep it conversational and fun, not a test. The lesson_title should say "Weekly Review".`
      : language === "hindi"
      ? `Language focus: Hindi. Make this feel like a solid CBSE Grade 6 micro-lesson, not nursery-level content. Teach ONE small chunk only: either 4-5 useful school-and-home vocabulary words, OR one simple everyday sentence pattern, OR 2-3 Devanagari letters with real word examples. Every Hindi item must include Devanagari, transliteration, English meaning, and one very short example sentence. Keep it beginner-friendly, but the examples should sound appropriate for a 6th standard student.`
      : `Language focus: Sanskrit. Today teach ONE small chunk — either 4-5 basic Sanskrit words (common nouns), OR one simple Sanskrit shloka line with meaning, OR 2-3 Devanagari letters used in Sanskrit. Include transliteration. This student is starting from zero Sanskrit, so keep it extremely simple and memorable.`;

  return `You are a content creator for a daily learning session for Aashvath, a Grade 6 CBSE student in India.

STUDENT PROFILE:
- Age: 11 years
- IQ: ~130 (gifted)
- Has dysgraphia — writing is physically hard for him; keep all writing tasks short (max 5 lines)
- Loves science, non-fiction, space, technology
- Learns by watching YouTube videos, not reading books
- Very poor in Hindi and Sanskrit (starting from near-zero)
- Session is supervised by his father at 9PM-10PM
- School: Heritage Experiential School, CBSE curriculum

TODAY: ${fullDate}
READING TOPIC THIS WEEK: ${topic}
${languageInstructions}

RECENT READ-ALOUD TITLES TO AVOID REPEATING:
${recentReadingNotes}

Generate a daily learning package. Be engaging, surprising, and age-appropriate. The science content should feel like a YouTube thumbnail — use the most amazing, counterintuitive angle possible. The language lesson should be one tiny memorable chunk, never overwhelming.
Do not reuse a recent read-aloud title, central fact, or passage angle from the list above.
The writing exercise must be EXACTLY 3 short lines, each on its own new line. Do not return one long sentence or a paragraph.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "date": "${dateStr}",
  "science_hook": "One sentence jaw-dropping science fact related to ${topic}. Use numbers, comparisons, or something that sounds impossible but is true.",
  "reading": {
    "title": "Catchy title for the passage",
    "topic": "${topic}",
    "passage": "200-300 word engaging passage about ${topic} written for a curious 11-year-old. Short paragraphs. Vivid, specific. Include one surprising statistic or comparison. Avoid jargon or explain it immediately.",
    "comprehension_questions": [
      "Question 1 (factual recall from the passage)",
      "Question 2 (inference or reason from the passage)",
      "Question 3 (connect to real life or Aashvath's interests)"
    ]
  },
  "language": {
    "type": "${language}",
    "lesson_title": "Short lesson title",
    "content": "The actual lesson content. For vocabulary: present each word as: DEVANAGARI (transliteration) = English meaning, example in a sentence. For grammar/patterns: show the pattern with 2-3 examples. For shloka: the text + transliteration + word-by-word meaning + full meaning. Keep it scannable, not wall-of-text.",
    "practice_task": "One specific, tiny task. E.g. 'Say this sentence 3 times out loud' or 'Copy this word in Devanagari twice' or 'Fill the blank: ___ (water) is needed for life'. Keep it achievable in 2-3 minutes.",
    "remember_tip": "One clever memory trick, story, or visual association to help remember the lesson. E.g. 'पानी sounds like the English word PUNNY — water can be punny!'"
  },
  "writing": {
    "type": "copy",
    "prompt": "A 3-line passage for Aashvath to copy neatly. It should be about science or something he finds interesting. Return exactly 3 short sentences, each on a separate line using newline characters.",
    "lines_required": 3,
    "success_criteria": ["All 3 lines are attempted", "Letters are legible", "No skipped words"]
  },
  "ethics_reflection": "One thought (2-3 sentences) about the value of discipline, effort, or honesty. Connect it to Aashvath's world — school, sports, video games, science experiments. Not preachy. More like a coach talking to a player.",
  "next_day_tip": "A specific, actionable reminder for tomorrow. E.g. 'Check if you have your science notebook for tomorrow's class' or 'Review the Hindi words from today one more time before breakfast'. Keep it concrete."
}`;
}

export async function generateContentForDate(dateStr: string): Promise<DailyContent> {
  const prompt = await buildPrompt(dateStr);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("Empty response from OpenAI");

  return normalizeDailyContent(dateStr, JSON.parse(raw) as DailyContent);
}

export async function getOrCreatePlan(dateStr: string) {
  const date = parseDate(dateStr);

  const existing = await prisma.dailyPlan.findUnique({
    where: { date },
  });

  if (existing) return existing;

  const content = await generateContentForDate(dateStr);

  return prisma.dailyPlan.create({
    data: {
      date,
      content: content as object,
    },
  });
}

export async function regeneratePlanForDate(dateStr: string) {
  const date = parseDate(dateStr);
  const content = await generateContentForDate(dateStr);

  return prisma.dailyPlan.upsert({
    where: { date },
    update: {
      content: content as object,
      generatedAt: new Date(),
    },
    create: {
      date,
      content: content as object,
    },
  });
}

// Generate plans for a range of dates (used for bulk pre-generation)
export async function generatePlansUpTo(untilDateStr: string) {
  const until = parseDate(untilDateStr);
  const results: string[] = [];

  const current = parseDate(todayString());
  while (current <= until) {
    const dateStr = current.toISOString().split("T")[0];
    try {
      const existing = await prisma.dailyPlan.findUnique({
        where: { date: parseDate(dateStr) },
      });
      if (!existing) {
        await getOrCreatePlan(dateStr);
        results.push(`✓ Generated ${dateStr}`);
      } else {
        results.push(`- Skipped ${dateStr} (exists)`);
      }
    } catch (err) {
      results.push(`✗ Failed ${dateStr}: ${err}`);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return results;
}
