"use client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface DailyMetric {
  date: string;
  status: string;
  writingLines: number | null;
  writingLegibility: number | null;
  writingEffort: number | null;
  languageConfidence: number | null;
  homeworkCompleteness: number | null;
  discipline: number | null;
  shortcutUsage: string | null;
  readingCompleted: boolean | null;
  readingComprehension: number | null;
}

const shortDate = (d: string) => format(parseISO(d), "MMM d");

export function WritingChart({ data }: { data: DailyMetric[] }) {
  const chartData = data
    .filter((d) => d.writingLines !== null)
    .map((d) => ({
      date: shortDate(d.date),
      Lines: d.writingLines,
      Legibility: d.writingLegibility,
      Effort: d.writingEffort,
    }));

  if (chartData.length === 0)
    return <p className="text-gray-400 text-sm text-center py-8">No writing data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Lines" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Legibility" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Effort" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function LanguageChart({ data }: { data: DailyMetric[] }) {
  const chartData = data
    .filter((d) => d.languageConfidence !== null)
    .map((d) => ({
      date: shortDate(d.date),
      Confidence: d.languageConfidence,
    }));

  if (chartData.length === 0)
    return <p className="text-gray-400 text-sm text-center py-8">No language data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="Confidence" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DisciplineChart({ data }: { data: DailyMetric[] }) {
  const chartData = data
    .filter((d) => d.discipline !== null)
    .map((d) => ({
      date: shortDate(d.date),
      Discipline: d.discipline,
      Homework: d.homeworkCompleteness,
    }));

  if (chartData.length === 0)
    return <p className="text-gray-400 text-sm text-center py-8">No discipline data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Discipline" stroke="#ec4899" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Homework" stroke="#8b5cf6" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
