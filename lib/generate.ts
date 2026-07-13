import OpenAI from "openai";
import { prisma } from "./prisma";
import { formatDisplayDate, getTopicForDate, getLanguageForDate, parseDate, todayString } from "./utils";
import type { DailyContent } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SUMMER_READING_WORDS_MIN = 650;
const SUMMER_READING_WORDS_MAX = 850;

const FOCUS_COACHING_THEMES = [
  "finishing homework fully and checking it before packing",
  "focusing in class: notice distraction, return attention to the teacher, and capture the next useful point",
  "the after-school landing routine: put the bag at the study spot, check the diary, eat, reset, then begin before screens",
  "work ethic: start without bargaining, do the hard part first, and prefer complete work over clever shortcuts",
  "listening when instructions are given and asking one clear question when something is unclear",
  "using short focus sprints, completing one task at a time, and taking a planned break instead of drifting",
  "being dependable: remember materials, meet small promises, and repair unfinished work without excuses",
];

const PUBLIC_DOMAIN_READING_SOURCES = [
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", focus: "resilience, observation, nature, friendship" },
  { title: "The Railway Children", author: "E. Nesbit", focus: "family responsibility, courage, practical problem-solving" },
  { title: "The Wind in the Willows", author: "Kenneth Grahame", focus: "friendship, choices, consequences, adventure" },
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", focus: "logic, curiosity, language play, absurdity" },
  { title: "The Jungle Book", author: "Rudyard Kipling", focus: "discipline, belonging, rules, observation of nature" },
  { title: "The Story of Doctor Dolittle", author: "Hugh Lofting", focus: "empathy, science-minded observation, animals, travel" },
  { title: "The Book of Dragons", author: "E. Nesbit", focus: "fantasy, cause and effect, clever problem-solving" },
  { title: "The Burgess Bird Book for Children", author: "Thornton W. Burgess", focus: "natural history, classification, close attention" },
];

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

function readingSourceForDate(dateStr: string) {
  const days = Math.floor(parseDate(dateStr).getTime() / 86_400_000);
  return PUBLIC_DOMAIN_READING_SOURCES[days % PUBLIC_DOMAIN_READING_SOURCES.length];
}

function focusCoachingThemeForDate(dateStr: string): string {
  const days = Math.floor(parseDate(dateStr).getTime() / 86_400_000);
  return FOCUS_COACHING_THEMES[days % FOCUS_COACHING_THEMES.length];
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
      : 5;

  const uniqueQuestions = dedupeQuestions(content.reading.comprehension_questions ?? []);
  while (uniqueQuestions.length < 5) {
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
      comprehension_questions: uniqueQuestions.slice(0, 5),
      source_title: content.reading.source_title
        ? normalizeWhitespace(content.reading.source_title)
        : content.reading.source_title,
      source_author: content.reading.source_author
        ? normalizeWhitespace(content.reading.source_author)
        : content.reading.source_author,
      source_note: content.reading.source_note
        ? normalizeWhitespace(content.reading.source_note)
        : content.reading.source_note,
      focus_work_ethic_coaching: content.reading.focus_work_ethic_coaching
        ? normalizeWhitespace(content.reading.focus_work_ethic_coaching)
        : content.reading.focus_work_ethic_coaching,
    },
    language: {
      ...content.language,
      lesson_title: normalizeWhitespace(content.language.lesson_title),
      content: content.language.content.trim(),
      practice_task: normalizeWhitespace(content.language.practice_task),
      remember_tip: normalizeWhitespace(content.language.remember_tip),
      humour_hook: content.language.humour_hook
        ? normalizeWhitespace(content.language.humour_hook)
        : content.language.humour_hook,
      word_formation_deep_dive: content.language.word_formation_deep_dive
        ? content.language.word_formation_deep_dive.trim()
        : content.language.word_formation_deep_dive,
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
  const readingSource = readingSourceForDate(dateStr);
  const focusCoachingTheme = focusCoachingThemeForDate(dateStr);
  const dayOfWeek = parseDate(dateStr).getUTCDay();
  const isWeeklyWordFormationDeepDive = language === "hindi" && dayOfWeek === 3;
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
      ? `Language focus: Sunday review day. Give a serious revision covering 6 Hindi words, 6 Sanskrit words, and 4 sentence-level recall questions from this week's language work. The lesson_title should say "Weekly Review".`
      : language === "hindi"
      ? `Language focus: Hindi. Make this an expanded, rigorous CBSE Grade 6 summer lesson. Teach 10-12 useful vocabulary words plus two sentence patterns, with Devanagari, transliteration, English meaning, and short example sentences. Include an 8-item oral/written practice task. Keep it beginner-accessible but not nursery-level. Use clever, witty humour that an 11-year-old who enjoys memes will actually understand; never use baby talk.${
          isWeeklyWordFormationDeepDive
            ? " This is the weekly Wednesday WORD FORMATION DEEP DIVE: take one useful Hindi word apart carefully (root/base, prefix or suffix where genuinely applicable, related word family, sound/spelling change, meaning logic, and 3 examples). Accuracy matters: do not invent a root or false etymology."
            : " Set word_formation_deep_dive to null today; the full deep dive happens once each week on Wednesday."
        }`
      : `Language focus: Sanskrit. Make this a rigorous beginner Sanskrit summer lesson. Teach 8-10 common words OR one short shloka line plus 5 grammar/vocabulary items. Include transliteration, word meanings, and a 6-item oral/written practice task. Keep it clear but substantive.`;

  return `You are a content creator for a daily learning session for Aashvath, a Grade 6 CBSE student in India.

STUDENT PROFILE:
- Age: 11 years
- IQ: ~130 (gifted)
- Has dysgraphia — writing is physically hard for him; keep all writing tasks short (max 5 lines)
- Loves science, non-fiction, space, technology
- Learns by watching YouTube videos, not reading books
- Very poor in Hindi and Sanskrit (starting from near-zero)
- Summer holidays are active now, so the session can be longer and more rigorous than the school-night plan.
- Session is supervised by his father; target total duration is about 90 minutes during holidays.
- School: Heritage Experiential School, CBSE curriculum

TODAY: ${fullDate}
READING TOPIC THIS WEEK: ${topic}
${languageInstructions}
TODAY'S FREE/PUBLIC-DOMAIN READING ANCHOR:
- Book: ${readingSource.title}
- Author: ${readingSource.author}
- Use this as the day's age-appropriate reading source/theme: ${readingSource.focus}

RECENT READ-ALOUD TITLES TO AVOID REPEATING:
${recentReadingNotes}

Generate a summer-holiday daily learning package. It should be engaging, rigorous, and age-appropriate for a gifted Grade 6 student who avoids reading.
Reading must be at least one printed page: ${SUMMER_READING_WORDS_MIN}-${SUMMER_READING_WORDS_MAX} words, split into short paragraphs. Use the public-domain reading anchor above as the source/theme, but create a self-contained original passage or adapted public-domain-style chapter page suitable for this learner. Do not quote modern copyrighted books.
After the main passage, include a separate 130-180 word read-aloud coaching paragraph about ${focusCoachingTheme}. It must show Aashvath a realistic school/home moment, explain why the habit matters, and give a tiny action sequence he can use immediately. Sound like a smart coach, not a lecture; avoid shame, labels, threats, and vague advice such as merely saying "focus more". Vary the scenario and wording from day to day.
Include enough tasks to fill about 90 minutes: deeper reading, 5 comprehension questions, a more substantial language lesson, 5-line writing, and a concrete follow-up task.
The science content should feel like a smart YouTube hook, but the work itself should require focus.
Do not reuse a recent read-aloud title, central fact, or passage angle from the list above.
The writing exercise must be EXACTLY 5 short lines, each on its own new line. Do not return one long sentence or a paragraph.

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "date": "${dateStr}",
  "science_hook": "One sentence jaw-dropping science fact related to ${topic}. Use numbers, comparisons, or something that sounds impossible but is true.",
  "reading": {
    "title": "Catchy title for today's one-page reading",
    "topic": "${topic}",
    "source_title": "${readingSource.title}",
    "source_author": "${readingSource.author}",
    "source_note": "Free/public-domain reading anchor used for today's summer reading.",
    "passage": "${SUMMER_READING_WORDS_MIN}-${SUMMER_READING_WORDS_MAX} word one-page reading for a curious 11-year-old. Short paragraphs. Use the mood/theme of ${readingSource.title} by ${readingSource.author}, connect it naturally to ${topic}, and include concrete details, inference opportunities, and one surprising science/history comparison.",
    "focus_work_ethic_coaching": "A separate 130-180 word read-aloud coaching paragraph focused on ${focusCoachingTheme}. Use a realistic scenario, explain the value, and end with a memorable 3-step action Aashvath can try tomorrow.",
    "comprehension_questions": [
      "Question 1 (factual recall from the passage)",
      "Question 2 (inference or reason from the passage)",
      "Question 3 (vocabulary or phrase meaning from context)",
      "Question 4 (evidence-based explanation using two details)",
      "Question 5 (connect to real life, science, or Aashvath's interests)"
    ]
  },
  "language": {
    "type": "${language}",
    "lesson_title": "Short lesson title",
    "content": "The actual lesson content. For vocabulary: present each word as: DEVANAGARI (transliteration) = English meaning, example in a sentence. For grammar/patterns: show the pattern with 4-5 examples. For shloka: the text + transliteration + word-by-word meaning + full meaning. Make it scannable but substantive.",
    "practice_task": "For Hindi, an 8-item practice task; otherwise 6 items. It should take 10-15 minutes and include speaking, recognition, and one short written/copy item.",
    "remember_tip": "One clever memory trick, story, or visual association to help remember the lesson.",
    "humour_hook": "For Hindi, one witty meme-style joke/caption using today's words correctly, followed by a one-sentence explanation of the language joke. For Sanskrit/review, use null unless genuinely useful.",
    "word_formation_deep_dive": ${isWeeklyWordFormationDeepDive ? '"A structured, accurate deep dive with headings: BUILD IT, WORD FAMILY, MEANING LOGIC, TRY IT. Explain one Hindi word formation in detail and give 3 examples."' : "null"}
  },
  "writing": {
    "type": "copy",
    "prompt": "A 5-line passage for Aashvath to copy neatly. It should connect today's reading to science, responsibility, or observation. Return exactly 5 short sentences, each on a separate line using newline characters.",
    "lines_required": 5,
    "success_criteria": ["All 5 lines are attempted", "Letters are legible", "No skipped words", "Margins and spacing are controlled"]
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
    max_tokens: 4000,
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
