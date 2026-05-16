import { format, getWeek, getDay } from "date-fns";

export function toDateString(date: Date): string {
  // Prisma returns DATE columns as UTC midnight — extract the UTC date string
  return date.toISOString().split("T")[0];
}

export function todayString(): string {
  // Always return date in IST (UTC+5:30)
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

export function parseDate(dateStr: string): Date {
  // Use UTC midnight to avoid timezone-shift issues with MySQL DATE columns
  return new Date(dateStr + "T00:00:00.000Z");
}

export function formatDisplayDate(dateStr: string): string {
  // Parse date parts directly to avoid TZ shift in format()
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${days[dt.getUTCDay()]}, ${months[m - 1]} ${d}, ${y}`;
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
