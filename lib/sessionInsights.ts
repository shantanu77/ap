import { addDays, differenceInCalendarDays, format, max, min, startOfDay, subDays } from "date-fns";
import type { DailyPlan, PhaseRating, Session, SessionStatus } from "@prisma/client";
import type { DailyContent } from "@/types";

export interface DailyInsight {
  date: string;
  status: SessionStatus | "ABSENT";
  absent: boolean;
  completedPhaseCount: number;
  incompleteTaskCount: number;
  incompleteTasks: string[];
  writingLines: number | null;
  writingLinesRequired: number | null;
  writingCompletionRate: number | null;
  writingLegibility: number | null;
  writingEffort: number | null;
  languageConfidence: number | null;
  homeworkCompleteness: number | null;
  discipline: number | null;
  shortcutUsage: string | null;
  readingCompleted: boolean | null;
  readingComprehension: number | null;
}

export interface SessionWithRatings extends Session {
  phases: PhaseRating[];
  dailyPlan: DailyPlan;
}

const SESSION_PHASE_COUNT = 6;

function dateKey(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function writingLinesRequired(session: SessionWithRatings | undefined): number | null {
  const content = (session?.dailyPlan.editedContent ?? session?.dailyPlan.content) as Partial<DailyContent> | undefined;
  const required = content?.writing?.lines_required;
  return typeof required === "number" && Number.isFinite(required) ? required : null;
}

function buildIncompleteTasks(
  session: SessionWithRatings | undefined,
  ratings: Record<string, Record<string, unknown>>,
  requiredWritingLines: number | null
): string[] {
  if (!session) return ["Session not attended"];

  const tasks: string[] = [];
  const completedPhaseCount = session.phases.filter((phase) => phase.completed).length;
  if (completedPhaseCount < SESSION_PHASE_COUNT) {
    tasks.push(`${SESSION_PHASE_COUNT - completedPhaseCount} phase${SESSION_PHASE_COUNT - completedPhaseCount === 1 ? "" : "s"} not completed`);
  }

  if (asBoolean(ratings.READ_ALOUD?.completed) === false) tasks.push("Read-aloud task not completed");
  if (asBoolean(ratings.LANGUAGE?.completed) === false) tasks.push("Hindi/Sanskrit lesson not completed");

  const linesWritten = asNumber(ratings.WRITING?.linesWritten);
  if (requiredWritingLines !== null && linesWritten !== null && linesWritten < requiredWritingLines) {
    tasks.push(`Writing incomplete (${linesWritten}/${requiredWritingLines} lines)`);
  }

  const homeworkCompleteness = asNumber(ratings.WORK_QUALITY?.homeworkCompleteness);
  if (homeworkCompleteness !== null && homeworkCompleteness < 3) tasks.push("Homework completeness below target");
  if (ratings.WORK_QUALITY?.shortcutUsage === "major") tasks.push("Major shortcut usage");

  if (asBoolean(ratings.NEXT_DAY_PREP?.bagPacked) === false) tasks.push("School bag not packed");
  if (asBoolean(ratings.NEXT_DAY_PREP?.goalSet) === false) tasks.push("Tomorrow goal not set");

  return tasks;
}

export function buildDailyInsights(
  sessions: SessionWithRatings[],
  windowStart: Date,
  windowEnd: Date = new Date()
): DailyInsight[] {
  if (sessions.length === 0) return [];

  const earliestSessionDate = min(sessions.map((session) => session.date));
  const start = startOfDay(max([windowStart, earliestSessionDate]));
  const end = startOfDay(windowEnd);
  const days = Math.max(0, differenceInCalendarDays(end, start));
  const sessionsByDate = new Map(sessions.map((session) => [dateKey(session.date), session]));

  return Array.from({ length: days + 1 }, (_, index) => {
    const current = addDays(start, index);
    const key = dateKey(current);
    const session = sessionsByDate.get(key);
    const phaseRatings = new Map(session?.phases.map((phase) => [phase.phase, asRecord(phase.ratings)]) ?? []);
    const ratings = Object.fromEntries(phaseRatings) as Record<string, Record<string, unknown>>;
    const requiredLines = writingLinesRequired(session);
    const incompleteTasks = buildIncompleteTasks(session, ratings, requiredLines);
    const writingLines = asNumber(ratings.WRITING?.linesWritten);

    return {
      date: key,
      status: session?.status ?? "ABSENT",
      absent: !session || session.status === "MISSED",
      completedPhaseCount: session?.phases.filter((phase) => phase.completed).length ?? 0,
      incompleteTaskCount: incompleteTasks.length,
      incompleteTasks,
      writingLines,
      writingLinesRequired: requiredLines,
      writingCompletionRate:
        writingLines !== null && requiredLines ? Math.round((writingLines / requiredLines) * 100) : null,
      writingLegibility: asNumber(ratings.WRITING?.legibility),
      writingEffort: asNumber(ratings.WRITING?.effort),
      languageConfidence: asNumber(ratings.LANGUAGE?.confidence),
      homeworkCompleteness: asNumber(ratings.WORK_QUALITY?.homeworkCompleteness),
      discipline: asNumber(ratings.WORK_QUALITY?.discipline),
      shortcutUsage:
        typeof ratings.WORK_QUALITY?.shortcutUsage === "string"
          ? String(ratings.WORK_QUALITY.shortcutUsage)
          : null,
      readingCompleted: asBoolean(ratings.READ_ALOUD?.completed),
      readingComprehension: asNumber(ratings.READ_ALOUD?.comprehension),
    };
  });
}

export function defaultInsightsStart(): Date {
  return subDays(new Date(), 90);
}
