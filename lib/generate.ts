import OpenAI from "openai";
import { prisma } from "./prisma";
import { formatDisplayDate, getTopicForDate, getLanguageForDate, parseDate, todayString } from "./utils";
import type { DailyContent } from "@/types";
import type { KidProfile } from "@prisma/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const READING_WORDS_MIN = 450;
const READING_WORDS_MAX = 600;

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
    const terms = new Set(normalized.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !["what", "which", "when", "where", "would", "could", "explain", "describe", "according", "passage"].includes(word)));
    const repeatedIdea = unique.some((existing) => {
      const other = new Set(existing.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !["what", "which", "when", "where", "would", "could", "explain", "describe", "according", "passage"].includes(word)));
      const shared = [...terms].filter((word) => other.has(word)).length;
      return terms.size > 0 && other.size > 0 && shared / Math.min(terms.size, other.size) >= 0.72;
    });
    if (!normalized || seen.has(normalized) || repeatedIdea) continue;
    seen.add(normalized);
    unique.push(normalizeWhitespace(question));
  }

  while (unique.length < 5) unique.push(`Choose a different detail from the passage and explain why it matters (question ${unique.length + 1}).`);

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

function nextDateString(dateStr: string): string {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split("T")[0];
}

function dayContext(dateStr: string) {
  const day = parseDate(dateStr).getUTCDay();
  const isWeekend = day === 0 || day === 6;
  const isHoliday = new Set(
    (process.env.SCHOOL_HOLIDAYS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
  ).has(dateStr);

  return {
    is_school_day: !isWeekend && !isHoliday,
    reason: isWeekend ? "weekend" as const : isHoliday ? "holiday" as const : "school_day" as const,
    label: isWeekend ? "Weekend reflection" : isHoliday ? "Holiday reflection" : "School-day reflection",
  };
}

function nextDayContext(dateStr: string) {
  const date = nextDateString(dateStr);
  const context = dayContext(date);

  return {
    date,
    label: formatDisplayDate(date),
    isSchoolDay: context.is_school_day,
    reason: context.reason,
  };
}

function defaultNextDayPrep(dateStr: string, todaySkill: string) {
  const next = nextDayContext(dateStr);

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
        "Check the diary and timetable, note the next school date, and leave packing for the appropriate evening.",
      ],
    };
  }

  return {
    date: next.date,
    label: next.label,
    is_school_day: true,
    reason: next.reason,
    focus: `Arrive ready and follow through independently. Keep one useful idea from today's ${todaySkill} lesson fresh.`,
    checklist: [
      `Finish or correct today's ${todaySkill} task before packing it away.`,
      `Check the real diary and timetable for ${next.label}; list every required item.`,
      "Pack each listed book, notebook, worksheet, and special item, ticking the diary as you go.",
      `Spend 10 minutes reviewing one useful idea from today's ${todaySkill} lesson.`,
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
  const { targeted_practice: _obsoletePractice, ...currentContent } = content as DailyContent & { targeted_practice?: unknown };
  const linesRequired = 10;
  const rawWritingPrompt = normalizeWhitespace(content.writing?.prompt ?? "");
  const writingTopic = (rawWritingPrompt.match(/[.!?](?:\s|$)/g)?.length ?? 0) > 3
    ? `Write an original paragraph of up to 100 words about ${content.reading.topic.toLowerCase()}. Explain one interesting idea and connect it to your own experience.`
    : rawWritingPrompt;

  const uniqueQuestions = dedupeQuestions(content.reading.comprehension_questions ?? []);
  while (uniqueQuestions.length < 5) {
    uniqueQuestions.push(`What is one important idea from the passage in question ${uniqueQuestions.length + 1}?`);
  }
  // Daily work stays within its lesson; do not surface the old arbitrary
  // weekday maths booster retained in previously cached plans.
  const todaySkill = normalizeWhitespace(content.reading?.topic ?? "today's lesson");
  const fallbackNextDayPrep = defaultNextDayPrep(dateStr, todaySkill);
  // Replace stale generated prep too; older cached plans may contain the
  // unrelated weekday maths booster we no longer assign.
  const normalizedNextDayPrep = fallbackNextDayPrep;

  return {
    ...currentContent,
    date: dateStr,
    day_context: dayContext(dateStr),
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
      practice_sentences: (Array.isArray(content.language.practice_sentences) && content.language.practice_sentences.length
        ? content.language.practice_sentences
        : content.language.type === "sanskrit"
          ? [
              ["अहं प्रतिदिनं प्रातःकाले पुस्तकं पठामि, ततः नूतनान् शब्दान् लिखामि।", "ahaṃ pratidinaṃ prātaḥkāle pustakaṃ paṭhāmi, tataḥ nūtanān śabdān likhāmi", "I read a book every morning and then write new words.", "पठामि means ‘I read’ and लिखामि means ‘I write’; both verbs describe my actions.", "I read a book every morning and then write new words in my notebook."],
              ["बालकः प्रातः उद्याने मित्रैः सह क्रीडति, ततः विद्यालयं गच्छति।", "bālakaḥ prātaḥ udyāne mitraiḥ saha krīḍati, tataḥ vidyālayaṃ gacchati", "The boy plays with friends in the garden in the morning, then goes to school.", "क्रीडति means ‘plays’; गच्छति means ‘goes’ and describes the next action.", "The boy plays with his friends in the garden before he goes to school."],
              ["बालिका पुस्तकं पठति, नूतनान् शब्दान् लिखति, तेषाम् अर्थान् च स्मरति।", "bālikā pustakaṃ paṭhati, nūtanān śabdān likhati, teṣām arthān ca smarati", "The girl reads a book, writes new words, and remembers their meanings.", "लिखति means ‘writes’; the sentence links three actions by the girl.", "The girl reads a book, writes new words, and remembers what each one means."],
              ["वयं सायंकाले गृहकार्यं कुर्मः, अनन्तरं क्रीडाङ्गणे मित्रैः सह क्रीडामः।", "vayaṃ sāyaṃkāle gṛhakāryaṃ kurmaḥ, anantaraṃ krīḍāṅgaṇe mitraiḥ saha krīḍāmaḥ", "We do our homework in the evening and then play with friends on the playground.", "कुर्मः means ‘we do’ and क्रीडामः means ‘we play’; their endings match वयम् (‘we’).", "We finish our homework in the evening and then play with our friends outside."],
              ["पुष्पं सुन्दरं सुगन्धि च अस्ति, भ्रमराः तस्य समीपे आगच्छन्ति।", "puṣpaṃ sundaraṃ sugandhi ca asti, bhramarāḥ tasya samīpe āgacchanti", "The flower is beautiful and fragrant, and bees come near it.", "पुष्पम् means ‘flower’; the sentence describes it and says what the bees do.", "The flower is beautiful and fragrant, so bees come close to it."],
            ]
          : [
              ["मैं हर सुबह अपनी पसंद की कहानी पढ़ता हूँ और नए शब्द अपनी कॉपी में लिखता हूँ।", "maiṃ har subah apnī pasaṃd kī kahānī paṛhtā hū̃ aur naye śabd apnī kopī meṃ likhtā hū̃", "Every morning I read a story I like and write new words in my notebook.", "पढ़ता हूँ and लिखता हूँ describe two actions I do regularly.", "Every morning I read a story I enjoy and write new words in my notebook."],
              ["बालक सुबह बगीचे में अपने मित्रों के साथ खेलता है, फिर समय पर विद्यालय जाता है।", "bālak subah bagīce meṃ apne mitroṃ ke sāth khelta hai, phir samay par vidyālay jātā hai", "The boy plays with his friends in the garden in the morning, then goes to school on time.", "खेलता है and जाता है describe the boy’s two actions in order.", "The boy plays with his friends in the garden before going to school on time."],
              ["बालिका पुस्तक पढ़ती है, नए शब्द लिखती है और उनके अर्थ ध्यान से याद करती है।", "bālikā pustak paṛhtī hai, naye śabd likhtī hai aur unke arth dhyān se yād kartī hai", "The girl reads a book, writes new words, and carefully remembers their meanings.", "पढ़ती है, लिखती है, and करती है agree with बालिका.", "The girl reads a book, writes new words, and carefully remembers what they mean."],
              ["हम शाम को अपना गृहकार्य पूरा करते हैं और उसके बाद मैदान में खेलने जाते हैं।", "ham śām ko apnā gṛhkārya pūrā karte haiṃ aur uske bād maidān meṃ khelne jāte haiṃ", "We finish our homework in the evening and go to play on the field afterward.", "करते हैं and जाते हैं describe actions done by हम.", "We finish our homework in the evening and then go outside to play."],
              ["बगीचे में खिला हुआ फूल बहुत सुंदर और सुगंधित है, इसलिए मधुमक्खियाँ उसके पास आती हैं।", "bagīce meṃ khilā huā phūl bahut suṃdar aur sugandhit hai, isliye madhumakkhiyāṃ uske pās ātī haiṃ", "The flower blooming in the garden is beautiful and fragrant, so bees come near it.", "फूल means ‘flower’; मधुमक्खियाँ tells which visitors come near it.", "The flower blooming in the garden is beautiful and fragrant, so bees gather nearby."],
            ]).slice(0, 5).map((item) => Array.isArray(item) ? ({ sentence: item[0], transliteration: item[1], meaning: item[2], word_explanation: item[3], english_sentence: item[4] }) : ({
            ...item,
            sentence: normalizeWhitespace(item.sentence),
            transliteration: item.transliteration ? normalizeWhitespace(item.transliteration) : item.transliteration,
            meaning: normalizeWhitespace(item.meaning),
            word_explanation: normalizeWhitespace(item.word_explanation),
            english_sentence: normalizeWhitespace(item.english_sentence),
          })),
    },
    writing: {
      ...content.writing,
      lines_required: linesRequired,
      prompt: writingTopic,
      success_criteria: [
        "Write a complete paragraph of up to 100 words",
        "Use complete sentences and clear punctuation",
        "Check grammar and spelling",
      ],
    },
    next_day_prep: normalizedNextDayPrep,
    science_hook: normalizeWhitespace(content.science_hook),
    ethics_reflection: normalizeWhitespace(content.ethics_reflection),
    next_day_tip: normalizeWhitespace(content.next_day_tip),
  };
}

async function buildPrompt(dateStr: string, learner: Pick<KidProfile, "id" | "name" | "grade">): Promise<string> {
  const topic = getTopicForDate(dateStr);
  const language = getLanguageForDate(dateStr);
  const fullDate = formatDisplayDate(dateStr);
  const readingSource = readingSourceForDate(dateStr);
  const focusCoachingTheme = focusCoachingThemeForDate(dateStr);
  const next = nextDayContext(dateStr);
  const dayOfWeek = parseDate(dateStr).getUTCDay();
  const isAashvath = learner.id === "legacy-aashvath";
  const learnerGuidance = isAashvath
    ? "Use the existing family-provided learning preferences: keep handwriting demands short, allow oral rehearsal, and use science, space, or technology examples when they fit. Do not mention diagnoses, school, age, or ability labels in the lesson."
    : "Do not assume a diagnosis, ability level, school, interests, or past performance. Offer varied examples and age-appropriate choices for this grade.";
  const isWeeklyWordFormationDeepDive = language === "hindi" && dayOfWeek === 3;
  const recentPlans = await prisma.dailyPlan.findMany({
    where: {
      kidId: learner.id,
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
      ? `Language focus: Hindi. Teach 6-8 useful words and one sentence pattern with Devanagari, transliteration, English meaning, and examples. Include exactly 5 oral practice sentences in Devanagari, each a natural complete sentence of 9-14 Hindi words with a useful detail, reason, time, or linked action; do not use tiny one-clause examples. Include a 6-item practice task weighted toward recognition and speaking, with no more than two short written items. Keep it Grade ${learner.grade} appropriate and never use baby talk.${
          isWeeklyWordFormationDeepDive
            ? " This is the weekly Wednesday WORD FORMATION DEEP DIVE: take one useful Hindi word apart carefully (root/base, prefix or suffix where genuinely applicable, related word family, sound/spelling change, meaning logic, and 3 examples). Accuracy matters: do not invent a root or false etymology."
            : " Set word_formation_deep_dive to null today; the full deep dive happens once each week on Wednesday."
        }`
      : `Language focus: Sanskrit. Teach 5-6 common words OR one short line plus 3 grammar/vocabulary items. Include exactly 5 oral practice sentences in Devanagari, each a natural complete sentence of 8-12 Sanskrit words with a useful detail, reason, time, or linked action; avoid isolated two- or three-word examples. Include transliteration, word meanings, and a 5-item oral/recognition practice task with one short ordered-writing item. Aim for accurate, age-appropriate sentences with enough context to practise meaning and pronunciation.`;

  return `You are a content creator for a daily learning session for ${learner.name}, a Grade ${learner.grade} student in India.

STUDENT PROFILE:
- Grade: ${learner.grade}
- ${learnerGuidance}
- Keep the workload achievable and use clear, age-appropriate explanations.

TODAY: ${fullDate}
READING TOPIC THIS WEEK: ${topic}
${languageInstructions}
TODAY'S FREE/PUBLIC-DOMAIN READING ANCHOR:
- Book: ${readingSource.title}
- Author: ${readingSource.author}
- Use this as the day's age-appropriate reading source/theme: ${readingSource.focus}

RECENT READ-ALOUD TITLES TO AVOID REPEATING:
${recentReadingNotes}

NEXT-DAY CONTEXT:
- Date: ${next.label}
- School day: ${next.isSchoolDay ? "yes" : "no"}
- Reason: ${next.reason}
- Carry forward a useful idea from today's reading or language lesson; do not assign a new unrelated subject problem.
- ${next.isSchoolDay ? "Use the real diary/timetable for preparation. Never invent a timetable, class, book, or special material." : "Do not say school is tomorrow and do not ask the learner to pack for tomorrow. Focus on closing unfinished work, organisation, and checking the next actual school day."}

Generate a school-term daily learning package. It should be engaging, rigorous, and achievable for a Grade ${learner.grade} student.
Reading must be ${READING_WORDS_MIN}-${READING_WORDS_MAX} words, split into short paragraphs. Use the public-domain reading anchor above as the source/theme, but create a self-contained original passage or adapted public-domain-style chapter page suitable for this learner. Do not quote modern copyrighted books.
After the main passage, include a separate 130-180 word read-aloud coaching paragraph about ${focusCoachingTheme}. It must show ${learner.name} a realistic school/home moment, explain why the habit matters, and give a tiny action sequence the learner can use immediately. Sound like a smart coach, not a lecture; avoid shame, labels, threats, and vague advice such as merely saying "focus more". Vary the scenario and wording from day to day.
Make the five comprehension questions clearly different from one another. Never repeat a question or ask the same thing with changed wording. First question: literal retrieval; second: main idea; later ones: vocabulary, evidence and a fresh real-life connection.
Do not add an unrelated maths problem, subject booster, or extra practice task. Keep the session to the listed lesson activities.
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
    "passage": "${READING_WORDS_MIN}-${READING_WORDS_MAX} word reading for a curious Grade ${learner.grade} student. Short paragraphs. Use the mood/theme of ${readingSource.title} by ${readingSource.author}, connect it naturally to ${topic}, and include clearly retrievable details, inference opportunities, and one surprising science/history comparison.",
    "focus_work_ethic_coaching": "A separate 130-180 word read-aloud coaching paragraph focused on ${focusCoachingTheme}. Use a realistic scenario, explain the value, and end with a memorable 3-step action ${learner.name} can try tomorrow.",
    "comprehension_questions": [
      "Question 1 (literal retrieval: require two accurate details from the passage)",
      "Question 2 (state the main idea in one complete sentence)",
      "Question 3 (vocabulary or phrase meaning from context)",
      "Question 4 (evidence-based explanation using two details)",
      "Question 5 (connect to real life, science, or the learner's interests)"
    ]
  },
  "language": {
    "type": "${language}",
    "lesson_title": "Short lesson title",
    "content": "The actual lesson content. For vocabulary: present each word as: DEVANAGARI (transliteration) = English meaning, example in a sentence. For grammar/patterns: show the pattern with examples. For shloka: the text + transliteration + word-by-word meaning + full meaning. Make it scannable but substantive.",
    "practice_sentences": [
      {"sentence":"Hindi or Sanskrit sentence in native script","transliteration":"Latin transliteration","meaning":"English translation","word_explanation":"Explain the focus word simply","english_sentence":"A natural English sentence using the same idea"},
      {"sentence":"Second sentence","transliteration":"...","meaning":"...","word_explanation":"...","english_sentence":"..."},
      {"sentence":"Third sentence","transliteration":"...","meaning":"...","word_explanation":"...","english_sentence":"..."},
      {"sentence":"Fourth sentence","transliteration":"...","meaning":"...","word_explanation":"...","english_sentence":"..."},
      {"sentence":"Fifth sentence","transliteration":"...","meaning":"...","word_explanation":"...","english_sentence":"..."}
    ],
    "practice_task": "Five complete listen, explain, and speak sentences. Explain one focus word, give its English meaning, then use the same word in an English sentence. ${learner.name} speaks each target sentence for recording and evaluation.",
    "remember_tip": "One clever memory trick, story, or visual association to help remember the lesson.",
    "humour_hook": "For Hindi, one witty meme-style joke/caption using today's words correctly, followed by a one-sentence explanation of the language joke. For Sanskrit/review, use null unless genuinely useful.",
    "word_formation_deep_dive": ${isWeeklyWordFormationDeepDive ? '"A structured, accurate deep dive with headings: BUILD IT, WORD FAMILY, MEANING LOGIC, TRY IT. Explain one Hindi word formation in detail and give 3 examples."' : "null"}
  },
  "writing": {
    "type": "copy",
    "prompt": "Give ${learner.name} an engaging topic and clear writing prompt for an original complete paragraph of up to 100 words. Connect it to today's reading, science, responsibility, or observation. Do not provide the paragraph for the learner to copy.",
    "lines_required": 10,
    "success_criteria": ["Write one complete paragraph up to 100 words", "Use capitals and punctuation", "Check grammar and spelling", "Write legibly"]
  },
  "next_day_prep": {
    "date": "${next.date}",
    "label": "${next.label}",
    "is_school_day": ${next.isSchoolDay},
    "reason": "${next.reason}",
    "focus": "One specific discipline focus connecting today's work to the next useful action.",
    "checklist": [
      "Action 1: close or review one useful idea from today's reading or language lesson",
      "Action 2: one concrete organisation action",
      "Action 3: one unfinished-work or diary/timetable action appropriate to whether school is open",
      "Action 4: one short review action appropriate to ${next.label}",
      "Action 5: one independent follow-through action"
    ]
  },
  "ethics_reflection": "One thought (2-3 sentences) about the value of discipline, effort, or honesty. Connect it to ${learner.name}'s world — school, sports, hobbies, or science. Not preachy. More like a coach talking to a player.",
  "next_day_tip": "A specific, actionable reminder for ${next.label}. Respect whether it is a school day and never invent a timetable."
}`;
}

export async function generateContentForDate(dateStr: string, learner: Pick<KidProfile, "id" | "name" | "grade">): Promise<DailyContent> {
  const prompt = await buildPrompt(dateStr, learner);

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

export async function getOrCreatePlan(dateStr: string, learner: Pick<KidProfile, "id" | "name" | "grade">) {
  const date = parseDate(dateStr);

  const existing = await prisma.dailyPlan.findUnique({
    where: { kidId_date: { kidId: learner.id, date } },
  });

  if (existing) return existing;

  const content = await generateContentForDate(dateStr, learner);

  return prisma.dailyPlan.create({
    data: {
      date,
      kidId: learner.id,
      content: content as object,
    },
  });
}

export async function regeneratePlanForDate(dateStr: string, learner: Pick<KidProfile, "id" | "name" | "grade">) {
  const date = parseDate(dateStr);
  const content = await generateContentForDate(dateStr, learner);

  return prisma.dailyPlan.upsert({
    where: { kidId_date: { kidId: learner.id, date } },
    update: {
      content: content as object,
      generatedAt: new Date(),
    },
    create: {
      date,
      kidId: learner.id,
      content: content as object,
    },
  });
}

// Generate plans for a range of dates (used for bulk pre-generation)
export async function generatePlansUpTo(untilDateStr: string, learner: Pick<KidProfile, "id" | "name" | "grade">) {
  const until = parseDate(untilDateStr);
  const results: string[] = [];

  const current = parseDate(todayString());
  while (current <= until) {
    const dateStr = current.toISOString().split("T")[0];
    try {
      const existing = await prisma.dailyPlan.findUnique({ where: { kidId_date: { kidId: learner.id, date: parseDate(dateStr) } } });
      if (!existing) {
        await getOrCreatePlan(dateStr, learner);
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
