import OpenAI from "openai";
import { prisma } from "./prisma";
import { formatDisplayDate, getTopicForDate, getLanguageForDate, parseDate, todayString } from "./utils";
import type { DailyContent } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const READING_WORDS_MIN = 450;
const READING_WORDS_MAX = 600;

type AcademicFocus = {
  subject: string;
  skill: string;
  reportLevel: "S" | "P";
  meetingTarget: string;
  taskGuidance: string;
};

const ACADEMIC_FOCUS_ROTATION: AcademicFocus[] = [
  {
    subject: "Mathematics",
    skill: "fractions",
    reportLevel: "S",
    meetingTarget: "Represent equivalent fractions, place them on a number line, and solve one addition or subtraction problem with a clear model.",
    taskGuidance: "Use a number line or area model before calculating. Include one equivalence item and one short word problem.",
  },
  {
    subject: "English",
    skill: "literal comprehension and summarising",
    reportLevel: "S",
    meetingTarget: "Identify the main idea and retrieve three accurate details from a Grade 6 text without guessing.",
    taskGuidance: "Use a short fresh paragraph and require a main-idea sentence plus three details, each tied to exact words in the text.",
  },
  {
    subject: "Expedition / Science",
    skill: "cause-and-effect scientific explanation",
    reportLevel: "P",
    meetingTarget: "Explain a process in a complete cause → mechanism → effect chain using accurate subject vocabulary.",
    taskGuidance: "Rotate among groundwater recharge, the rock cycle, plant reproduction and forest regeneration, environmental balance, and acids/bases/neutralisation.",
  },
  {
    subject: "Mathematics",
    skill: "factors, multiples and data handling",
    reportLevel: "P",
    meetingTarget: "Choose the correct operation or representation, show working, and check that the answer fits the question.",
    taskGuidance: "Alternate a common-factor/common-multiple problem with a small table or graph interpretation task. Require one written reason.",
  },
  {
    subject: "English",
    skill: "narrative structure and writing conventions",
    reportLevel: "P",
    meetingTarget: "Plan and produce a short, ordered response with specific detail, complete sentences, capitals, punctuation, and checked spelling.",
    taskGuidance: "Use oral rehearsal first, then a four-sentence plan or an editing task. Keep handwriting volume dysgraphia-aware.",
  },
  {
    subject: "Digital Literacy",
    skill: "spreadsheet functions and flowcharts",
    reportLevel: "P",
    meetingTarget: "Select an appropriate spreadsheet function or flowchart symbol and explain why it fits the step.",
    taskGuidance: "Use a tiny data table or a familiar real-life algorithm. Require a prediction, the result, and one correction check.",
  },
  {
    subject: "Weekly Review",
    skill: "retrieval, organisation and independent follow-through",
    reportLevel: "P",
    meetingTarget: "Retrieve this week's key learning, identify unfinished work, and independently plan the first action for Monday.",
    taskGuidance: "Use a mixed five-item retrieval check covering the week's subjects, then one concrete organise-check-pack action.",
  },
];

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

function academicFocusForDate(dateStr: string): AcademicFocus {
  const dayOfWeek = parseDate(dateStr).getUTCDay();
  const mondayFirstIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return ACADEMIC_FOCUS_ROTATION[mondayFirstIndex];
}

function nextDateString(dateStr: string): string {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

function nextDayContext(dateStr: string) {
  const date = nextDateString(dateStr);
  const day = parseDate(date).getUTCDay();
  const isWeekend = day === 0 || day === 6;
  const isHoliday = new Set(
    (process.env.SCHOOL_HOLIDAYS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
  ).has(date);

  return {
    date,
    label: formatDisplayDate(date),
    isSchoolDay: !isWeekend && !isHoliday,
    reason: isWeekend ? "weekend" as const : isHoliday ? "holiday" as const : "school_day" as const,
  };
}

function defaultNextDayPrep(dateStr: string, todaySkill: string) {
  const next = nextDayContext(dateStr);
  const nextFocus = academicFocusForDate(next.date);

  if (!next.isSchoolDay) {
    return {
      date: next.date,
      label: next.label,
      is_school_day: false,
      reason: next.reason,
      focus: `Close today's ${todaySkill} work honestly and recover anything unfinished before leisure.`,
      checklist: [
        `Finish or correct today's ${todaySkill} task; do not carry a known gap forward.`,
        "Put today's books, worksheets, and stationery back in their proper places.",
        "Write down any unfinished school task and its exact first action.",
        `Choose a time for one 10-minute ${todaySkill} review.`,
        "Check the diary and timetable for the next school day only; do not pack as if school is tomorrow.",
      ],
    };
  }

  return {
    date: next.date,
    label: next.label,
    is_school_day: true,
    reason: next.reason,
    focus: `Arrive ready, follow through independently, and use ${nextFocus.skill} as the focused practice target.`,
    checklist: [
      `Finish or correct today's ${todaySkill} task before packing it away.`,
      `Check the real diary and timetable for ${next.label}; list every required item.`,
      "Pack each listed book, notebook, worksheet, and special item, ticking the diary as you go.",
      `Complete one 10-minute ${nextFocus.skill} review or worked example.`,
      "Set out the home study space and choose the first task to begin before screens.",
    ],
  };
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
  const normalizedTargetedPractice = content.targeted_practice
    ? {
        ...content.targeted_practice,
        subject: normalizeWhitespace(content.targeted_practice.subject),
        skill: normalizeWhitespace(content.targeted_practice.skill),
        meeting_target: normalizeWhitespace(content.targeted_practice.meeting_target),
        task: normalizeWhitespace(content.targeted_practice.task),
        success_criteria: (content.targeted_practice.success_criteria ?? [])
          .map(normalizeWhitespace)
          .filter(Boolean)
          .slice(0, 4),
        self_check: normalizeWhitespace(content.targeted_practice.self_check),
      }
    : undefined;
  const todaySkill = normalizedTargetedPractice?.skill ?? academicFocusForDate(dateStr).skill;
  const fallbackNextDayPrep = defaultNextDayPrep(dateStr, todaySkill);
  const normalizedNextDayPrep = content.next_day_prep
    ? {
        ...content.next_day_prep,
        date: fallbackNextDayPrep.date,
        label: fallbackNextDayPrep.label,
        is_school_day: fallbackNextDayPrep.is_school_day,
        reason: fallbackNextDayPrep.reason,
        focus: normalizeWhitespace(content.next_day_prep.focus),
        checklist: (content.next_day_prep.checklist ?? [])
          .map(normalizeWhitespace)
          .filter(Boolean)
          .slice(0, 6),
      }
    : fallbackNextDayPrep;

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
    targeted_practice: normalizedTargetedPractice,
    next_day_prep: normalizedNextDayPrep,
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
  const academicFocus = academicFocusForDate(dateStr);
  const next = nextDayContext(dateStr);
  const nextAcademicFocus = academicFocusForDate(next.date);
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
      ? `Language focus: Sunday review day. Give a focused retrieval review covering 4 Hindi words, 4 Sanskrit words, and 4 sentence-level recall questions from this week's language work. The lesson_title should say "Weekly Review".`
      : language === "hindi"
      ? `Language focus: Hindi. The report places overall Hindi at Progressing, with some grammar and vocabulary-identification standards at Starting. Teach 6-8 useful words and one sentence pattern with Devanagari, transliteration, English meaning, and short examples. Include a 6-item practice task weighted toward recognition and speaking, with no more than two short written items. Keep it Grade 6 appropriate and never use baby talk.${
          isWeeklyWordFormationDeepDive
            ? " This is the weekly Wednesday WORD FORMATION DEEP DIVE: take one useful Hindi word apart carefully (root/base, prefix or suffix where genuinely applicable, related word family, sound/spelling change, meaning logic, and 3 examples). Accuracy matters: do not invent a root or false etymology."
            : " Set word_formation_deep_dive to null today; the full deep dive happens once each week on Wednesday."
        }`
      : `Language focus: Sanskrit. The report places Sanskrit at Progressing across listening, speaking, reading and writing. Teach 5-6 common words OR one short line plus 3 grammar/vocabulary items. Include transliteration, word meanings, and a 5-item oral/recognition practice task with one short ordered-writing item. Aim for secure recall and accurate use, not volume.`;

  return `You are a content creator for a daily learning session for Aashvath, a Grade 6 CBSE student in India.

STUDENT PROFILE:
- Age: 11 years
- IQ: ~130 (gifted)
- Has dysgraphia — writing is physically hard for him; keep all writing tasks short (max 5 lines)
- Loves science, non-fiction, space, technology
- Learns by watching YouTube videos, not reading books
- Hindi and Sanskrit are both currently Progressing; some Hindi language-identification skills are Starting
- His verbal explanations often show stronger understanding than his written work
- Session is supervised by his father and must remain achievable on a school night
- School: Heritage Experiential School, CBSE curriculum

TERM 1 REPORT-BASED PRIORITIES:
- Strengths to preserve: oral interpretation, inference and text analysis, large-number arithmetic, magnet and electricity investigations, charting, and algorithms are already Meeting.
- Highest gaps: literal reading comprehension and fractions are Starting.
- Progressing areas to move toward Meeting: English discussion/presentation, narrative writing and conventions; Hindi and Sanskrit; factors/multiples and data handling; scientific classification and cause/effect explanations; spreadsheet functions and flowcharts.
- Work Ethics is Progressing in every reported academic subject. The teacher's key next step is organisation: plan tasks, manage resources, and follow through independently.
- Do not reteach a Meeting skill as if it were a weakness. Use it as a confidence-building bridge into today's target.

TODAY: ${fullDate}
READING TOPIC THIS WEEK: ${topic}
${languageInstructions}
TODAY'S FREE/PUBLIC-DOMAIN READING ANCHOR:
- Book: ${readingSource.title}
- Author: ${readingSource.author}
- Use this as the day's age-appropriate reading source/theme: ${readingSource.focus}

RECENT READ-ALOUD TITLES TO AVOID REPEATING:
${recentReadingNotes}

TODAY'S REPORT-BASED SUBJECT BOOSTER:
- Subject: ${academicFocus.subject}
- Skill: ${academicFocus.skill}
- Current report level: ${academicFocus.reportLevel}
- Definition of Meeting: ${academicFocus.meetingTarget}
- Task design: ${academicFocus.taskGuidance}

NEXT-DAY CONTEXT:
- Date: ${next.label}
- School day: ${next.isSchoolDay ? "yes" : "no"}
- Reason: ${next.reason}
- Carry forward today's ${academicFocus.skill} discipline target.
- ${next.isSchoolDay ? `Use the real diary/timetable for preparation and include a short ${nextAcademicFocus.skill} review. Never invent a timetable, class, book, or special material.` : "Do not say school is tomorrow and do not ask him to pack for tomorrow. Focus on closing unfinished work, organisation, a short review, and checking the next actual school day."}

Generate a school-term daily learning package. It should be engaging, rigorous, and achievable for a gifted Grade 6 student who avoids reading and finds handwriting physically demanding.
Reading must be ${READING_WORDS_MIN}-${READING_WORDS_MAX} words, split into short paragraphs. Use the public-domain reading anchor above as the source/theme, but create a self-contained original passage or adapted public-domain-style chapter page suitable for this learner. Do not quote modern copyrighted books.
After the main passage, include a separate 130-180 word read-aloud coaching paragraph about ${focusCoachingTheme}. It must show Aashvath a realistic school/home moment, explain why the habit matters, and give a tiny action sequence he can use immediately. Sound like a smart coach, not a lecture; avoid shame, labels, threats, and vague advice such as merely saying "focus more". Vary the scenario and wording from day to day.
Make the first two comprehension questions directly practise literal retrieval and main-idea summarising; later questions can use his existing inference/analysis strength.
Include one 10-15 minute targeted-practice task that follows today's subject booster exactly. It must have a small, observable finish line and no more than five handwritten lines.
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
    "source_note": "Free/public-domain reading anchor used for today's school-term reading.",
    "passage": "${READING_WORDS_MIN}-${READING_WORDS_MAX} word reading for a curious 11-year-old. Short paragraphs. Use the mood/theme of ${readingSource.title} by ${readingSource.author}, connect it naturally to ${topic}, and include clearly retrievable details, inference opportunities, and one surprising science/history comparison.",
    "focus_work_ethic_coaching": "A separate 130-180 word read-aloud coaching paragraph focused on ${focusCoachingTheme}. Use a realistic scenario, explain the value, and end with a memorable 3-step action Aashvath can try tomorrow.",
    "comprehension_questions": [
      "Question 1 (literal retrieval: require two accurate details from the passage)",
      "Question 2 (state the main idea in one complete sentence)",
      "Question 3 (vocabulary or phrase meaning from context)",
      "Question 4 (evidence-based explanation using two details)",
      "Question 5 (connect to real life, science, or Aashvath's interests)"
    ]
  },
  "language": {
    "type": "${language}",
    "lesson_title": "Short lesson title",
    "content": "The actual lesson content. For vocabulary: present each word as: DEVANAGARI (transliteration) = English meaning, example in a sentence. For grammar/patterns: show the pattern with 4-5 examples. For shloka: the text + transliteration + word-by-word meaning + full meaning. Make it scannable but substantive.",
    "practice_task": "A 5-6 item task taking about 10 minutes. Prioritise speaking, listening and recognition; include no more than two short written/copy items.",
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
  "targeted_practice": {
    "subject": "${academicFocus.subject}",
    "skill": "${academicFocus.skill}",
    "report_level": "${academicFocus.reportLevel}",
    "meeting_target": "${academicFocus.meetingTarget}",
    "task": "A complete, ready-to-do 10-15 minute task following this direction: ${academicFocus.taskGuidance}",
    "success_criteria": [
      "One concrete accuracy check specific to this task",
      "One check that requires working, evidence, or a complete explanation",
      "One check Aashvath can perform independently before finishing"
    ],
    "self_check": "One short question Aashvath answers before marking the task complete."
  },
  "next_day_prep": {
    "date": "${next.date}",
    "label": "${next.label}",
    "is_school_day": ${next.isSchoolDay},
    "reason": "${next.reason}",
    "focus": "One specific discipline focus connecting today's work to the next useful action.",
    "checklist": [
      "Action 1: close or correct today's ${academicFocus.skill} work",
      "Action 2: one concrete organisation action",
      "Action 3: one unfinished-work or diary/timetable action appropriate to whether school is open",
      "Action 4: one short review action appropriate to ${next.label}",
      "Action 5: one independent follow-through action"
    ]
  },
  "ethics_reflection": "One thought (2-3 sentences) about the value of discipline, effort, or honesty. Connect it to Aashvath's world — school, sports, video games, science experiments. Not preachy. More like a coach talking to a player.",
  "next_day_tip": "A specific, actionable reminder for ${next.label}. Respect whether it is a school day and never invent a timetable."
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
