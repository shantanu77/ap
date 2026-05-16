import { format, getWeek, getDay } from "date-fns";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayString(): string {
  return toDateString(new Date());
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseDate(dateStr), "EEEE, MMMM d, yyyy");
}

// Topic rotation based on ISO week number
const TOPICS = [
  "Space & Astronomy",
  "Human Body & Biology",
  "Physics & Forces",
  "Earth Science & Climate",
  "Technology & Inventions",
];

export function getTopicForDate(dateStr: string): string {
  const date = parseDate(dateStr);
  const week = getWeek(date);
  return TOPICS[week % TOPICS.length];
}

// Language rotation: Mon/Wed/Fri = Hindi, Tue/Thu/Sat = Sanskrit, Sun = Review
export function getLanguageForDate(dateStr: string): "hindi" | "sanskrit" | "review" {
  const dayOfWeek = getDay(parseDate(dateStr)); // 0=Sun, 1=Mon...6=Sat
  if (dayOfWeek === 0) return "review";
  if ([1, 3, 5].includes(dayOfWeek)) return "hindi";
  return "sanskrit";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
