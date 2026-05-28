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
  absent: boolean;
  completedPhaseCount: number;
  incompleteTaskCount: number;
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

const shortDate = (d: string) => format(parseISO(d), "MMM d");

export function WritingChart({ data }: { data: DailyMetric[] }) {
  const chartData = data
    .map((d) => ({
      date: shortDate(d.date),
      Completion: d.writingCompletionRate,
      Legibility: d.writingLegibility !== null ? d.writingLegibility * 20 : null,
      Effort: d.writingEffort !== null ? d.writingEffort * 20 : null,
      Absent: d.absent ? 100 : null,
    }));

  if (chartData.every((d) => d.Completion === null && d.Legibility === null && d.Effort === null && d.Absent === null))
    return <p className="text-gray-400 text-sm text-center py-8">No writing data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Completion" stroke="#22c55e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Legibility" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Effort" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="stepAfter" dataKey="Absent" stroke="#ef4444" strokeWidth={2} dot={false} />
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
    .map((d) => ({
      date: shortDate(d.date),
      Discipline: d.discipline,
      Homework: d.homeworkCompleteness,
      "Incomplete Tasks": d.incompleteTaskCount > 0 ? d.incompleteTaskCount : null,
    }));

  if (chartData.every((d) => d.Discipline === null && d.Homework === null && d["Incomplete Tasks"] === null))
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
        <Line type="stepAfter" dataKey="Incomplete Tasks" stroke="#ef4444" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AttendanceChart({ data }: { data: DailyMetric[] }) {
  const chartData = data.map((d) => ({
    date: shortDate(d.date),
    Attended: d.absent ? 0 : 1,
    Absent: d.absent ? 1 : 0,
    Incomplete: d.incompleteTaskCount > 0 && !d.absent ? 1 : 0,
  }));

  if (chartData.length === 0)
    return <p className="text-gray-400 text-sm text-center py-8">No attendance data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Attended" stackId="attendance" fill="#10b981" />
        <Bar dataKey="Incomplete" stackId="attendance" fill="#f59e0b" />
        <Bar dataKey="Absent" stackId="attendance" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
