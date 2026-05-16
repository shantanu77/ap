import OpenAI from "openai";
import { prisma } from "./prisma";
import { getTopicForDate, getLanguageForDate, parseDate, toDateString } from "./utils";
import type { DailyContent } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(dateStr: string): string {
  const topic = getTopicForDate(dateStr);
  const language = getLanguageForDate(dateStr);
  const date = parseDate(dateStr);
  const dayName = date.toLocaleDateString("en-IN", { weekday: "long" });
  const fullDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const languageInstructions =
    language === "review"
      ? `Language focus: Sunday review day. Give a light revision covering 3 Hindi words and 3 Sanskrit words the student may have seen earlier this week. Keep it conversational and fun, not a test. The lesson_title should say "Weekly Review".`
      : language === "hindi"
      ? `Language focus: Hindi. Today teach ONE small chunk — either 4-5 vocabulary words from daily life, OR one simple sentence pattern, OR 2-3 Devanagari letters with words. Include transliteration (Roman script) alongside Devanagari so a beginner can pronounce it. The content should be something a CBSE Grade 6 beginner can absorb in 15 minutes.`
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

Generate a daily learning package. Be engaging, surprising, and age-appropriate. The science content should feel like a YouTube thumbnail — use the most amazing, counterintuitive angle possible. The language lesson should be one tiny memorable chunk, never overwhelming.

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
    "prompt": "A 2-4 line passage for Aashvath to copy neatly. It should be about science or something he finds interesting. Short sentences. No fancy words. Example: 'Light travels at 300,000 km per second. The Sun is 150 million km away. It takes light 8 minutes to reach Earth from the Sun.' Adjust to be interesting and exactly 3-4 lines.",
    "lines_required": 3,
    "success_criteria": ["Each line is complete", "Letters are legible", "No skipped words"]
  },
  "ethics_reflection": "One thought (2-3 sentences) about the value of discipline, effort, or honesty. Connect it to Aashvath's world — school, sports, video games, science experiments. Not preachy. More like a coach talking to a player.",
  "next_day_tip": "A specific, actionable reminder for tomorrow. E.g. 'Check if you have your science notebook for tomorrow's class' or 'Review the Hindi words from today one more time before breakfast'. Keep it concrete."
}`;
}

export async function generateContentForDate(dateStr: string): Promise<DailyContent> {
  const prompt = buildPrompt(dateStr);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;
  if (!raw) throw new Error("Empty response from OpenAI");

  return JSON.parse(raw) as DailyContent;
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

// Generate plans for a range of dates (used for bulk pre-generation)
export async function generatePlansUpTo(untilDateStr: string) {
  const today = new Date();
  const until = parseDate(untilDateStr);
  const results: string[] = [];

  const current = new Date(today);
  while (current <= until) {
    const dateStr = toDateString(current);
    try {
      const existing = await prisma.dailyPlan.findUnique({
        where: { date: current },
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
    current.setDate(current.getDate() + 1);
  }

  return results;
}
