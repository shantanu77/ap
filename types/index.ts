export interface ReadingContent {
  title: string;
  topic: string;
  passage: string;
  comprehension_questions: string[];
  source_title?: string;
  source_author?: string;
  source_note?: string;
}

export interface LanguageContent {
  type: "hindi" | "sanskrit" | "review";
  lesson_title: string;
  content: string;
  practice_task: string;
  remember_tip: string;
  devanagari_words?: { word: string; meaning: string; transliteration: string }[];
}

export interface WritingContent {
  type: "copy" | "dictation" | "guided";
  prompt: string;
  lines_required: number;
  success_criteria: string[];
}

export interface DailyContent {
  date: string;
  science_hook: string;
  reading: ReadingContent;
  language: LanguageContent;
  writing: WritingContent;
  ethics_reflection: string;
  next_day_tip: string;
}

export interface DayReviewRating {
  mood: 1 | 2 | 3 | 4 | 5;
  engagement: 1 | 2 | 3 | 4 | 5;
  highlights: string;
}

export interface ReadAloudRating {
  completed: boolean;
  comprehension: number;
  interest: 1 | 2 | 3 | 4 | 5;
}

export interface LanguageRating {
  completed: boolean;
  confidence: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface WritingRating {
  linesWritten: number;
  legibility: 1 | 2 | 3 | 4 | 5;
  effort: 1 | 2 | 3 | 4 | 5;
}

export interface WorkQualityRating {
  homeworkCompleteness: 1 | 2 | 3 | 4 | 5;
  discipline: 1 | 2 | 3 | 4 | 5;
  shortcutUsage: "none" | "minor" | "major";
}

export interface NextDayPrepRating {
  bagPacked: boolean;
  goalSet: boolean;
  goal: string;
}

export type PhaseRatingData =
  | DayReviewRating
  | ReadAloudRating
  | LanguageRating
  | WritingRating
  | WorkQualityRating
  | NextDayPrepRating;

export const PHASES = [
  { id: "DAY_REVIEW", label: "Day Review", duration: 10, color: "amber" },
  { id: "READ_ALOUD", label: "Read Aloud", duration: 30, color: "blue" },
  { id: "LANGUAGE", label: "Hindi / Sanskrit", duration: 25, color: "orange" },
  { id: "WRITING", label: "Writing Exercise", duration: 20, color: "green" },
  { id: "WORK_QUALITY", label: "Work Quality Check", duration: 10, color: "rose" },
  { id: "NEXT_DAY_PREP", label: "Next Day Prep", duration: 5, color: "purple" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];
