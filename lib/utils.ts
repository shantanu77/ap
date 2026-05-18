const IST_TIME_ZONE = "Asia/Kolkata";

function getDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date");
  }

  return `${year}-${month}-${day}`;
}

function getUtcDate(dateStr: string): Date {
  const { year, month, day } = getDateParts(dateStr);
  return new Date(Date.UTC(year, month - 1, day));
}

function getIsoWeekNumber(dateStr: string): number {
  const date = getUtcDate(dateStr);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function toDateString(date: Date): string {
  // Prisma returns DATE columns as UTC midnight — extract the UTC date string
  return date.toISOString().split("T")[0];
}

export function todayString(): string {
  return formatDateInTimeZone(new Date(), IST_TIME_ZONE);
}

export function parseDate(dateStr: string): Date {
  // Use UTC midnight to avoid timezone-shift issues with MySQL DATE columns
  return getUtcDate(dateStr);
}

export function formatDisplayDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(getUtcDate(dateStr));
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
  const week = getIsoWeekNumber(dateStr);
  return TOPICS[week % TOPICS.length];
}

// Language rotation: Mon/Wed/Fri = Hindi, Tue/Thu/Sat = Sanskrit, Sun = Review
export function getLanguageForDate(dateStr: string): "hindi" | "sanskrit" | "review" {
  const dayOfWeek = getUtcDate(dateStr).getUTCDay(); // 0=Sun, 1=Mon...6=Sat
  if (dayOfWeek === 0) return "review";
  if ([1, 3, 5].includes(dayOfWeek)) return "hindi";
  return "sanskrit";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
