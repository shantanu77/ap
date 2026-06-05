"use client";
import { useEffect, useState } from "react";
import { WritingChart, LanguageChart, DisciplineChart, AttendanceChart } from "@/components/MetricCharts";

interface MetricsData {
  daily: Array<{
    date: string;
    status: string;
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
  }>;
  streak: number;
  totalSessions: number;
  completedSessions: number;
  attendedSessions: number;
  absentSessions: number;
  incompleteTaskDays: number;
  lateCompletedSessions: number;
  attendanceRate: number;
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-4 ${color} text-white`}>
      <p className="text-sm opacity-80 font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((d) => {
        setMetrics(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-center text-gray-500 py-16">Failed to load metrics.</p>;
  }

  const avgWritingLines =
    metrics.daily.filter((d) => d.writingCompletionRate !== null).length > 0
      ? (
          metrics.daily
            .filter((d) => d.writingCompletionRate !== null)
            .reduce((s, d) => s + (d.writingCompletionRate ?? 0), 0) /
          metrics.daily.filter((d) => d.writingCompletionRate !== null).length
        ).toFixed(1)
      : "—";

  const avgConfidence =
    metrics.daily.filter((d) => d.languageConfidence !== null).length > 0
      ? (
          metrics.daily
            .filter((d) => d.languageConfidence !== null)
            .reduce((s, d) => s + (d.languageConfidence ?? 0), 0) /
          metrics.daily.filter((d) => d.languageConfidence !== null).length
        ).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Progress Dashboard</h1>
      <p className="text-sm text-gray-500">Last 90 days</p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Current Streak"
          value={`${metrics.streak} 🔥`}
          sub="consecutive sessions"
          color="bg-indigo-600"
        />
        <StatCard
          label="Attendance"
          value={`${metrics.attendanceRate}%`}
          sub={`${metrics.attendedSessions} / ${metrics.totalSessions} days`}
          color="bg-emerald-600"
        />
        <StatCard
          label="Absences"
          value={metrics.absentSessions}
          sub="missed tracked days"
          color="bg-red-600"
        />
        <StatCard
          label="Avg Language Confidence"
          value={avgConfidence}
          sub="out of 5"
          color="bg-orange-500"
        />
        <StatCard
          label="Incomplete Task Days"
          value={metrics.incompleteTaskDays}
          sub={`avg writing ${avgWritingLines}%`}
          color="bg-slate-700"
        />
        <StatCard
          label="Completed Late"
          value={metrics.lateCompletedSessions}
          sub="caught up after planned day"
          color="bg-amber-600"
        />
      </div>

      {metrics.totalSessions === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
          No data yet. Complete a few sessions to see your progress!
        </div>
      )}

      {metrics.daily.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Attendance & Incomplete Work</h2>
          <AttendanceChart data={metrics.daily} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Missed days and incomplete-task days remain visible in reports.
          </p>
        </div>
      )}

      {/* Writing chart */}
      {metrics.daily.some((d) => d.writingCompletionRate !== null || d.absent) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">✏️ Writing Progress</h2>
          <WritingChart data={metrics.daily} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Writing completion, legibility, and effort normalized to 0-100.
          </p>
        </div>
      )}

      {/* Language chart */}
      {metrics.daily.some((d) => d.languageConfidence !== null) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">🗣️ Language Confidence</h2>
          <LanguageChart data={metrics.daily} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Hindi/Sanskrit confidence rating after each lesson (scale 1–5)
          </p>
        </div>
      )}

      {/* Discipline chart */}
      {metrics.daily.some((d) => d.discipline !== null) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">📋 Discipline & Homework</h2>
          <DisciplineChart data={metrics.daily} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Discipline focus and homework completeness (scale 1–5)
          </p>
        </div>
      )}

      {metrics.daily.some((d) => d.absent || d.incompleteTaskCount > 0) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Recent Report Flags</h2>
          <div className="space-y-2">
            {metrics.daily
              .filter((d) => d.absent || d.incompleteTaskCount > 0)
              .slice(-7)
              .reverse()
              .map((day) => (
                <div key={day.date} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-800">{day.date}</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      day.absent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {day.absent ? "Absent" : `${day.incompleteTaskCount} incomplete`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{day.incompleteTasks.join(", ")}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">🏅 Milestones</h2>
        <div className="space-y-2">
          {[
            { threshold: 1, label: "First Session", icon: "🌱" },
            { threshold: 7, label: "One Week Streak", icon: "🔥" },
            { threshold: 14, label: "Two Week Streak", icon: "⚡" },
            { threshold: 30, label: "One Month Streak", icon: "🌟" },
          ].map(({ threshold, label, icon }) => {
            const achieved = metrics.completedSessions >= threshold;
            return (
              <div
                key={label}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  achieved ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50 opacity-50"
                }`}
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      achieved ? "text-yellow-800" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-400">{threshold} sessions completed</p>
                </div>
                {achieved && (
                  <span className="ml-auto text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                    ✓ Earned
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
