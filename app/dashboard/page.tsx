"use client";
import { useEffect, useState } from "react";
import { WritingChart, LanguageChart, DisciplineChart } from "@/components/MetricCharts";

interface MetricsData {
  daily: Array<{
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
  }>;
  streak: number;
  totalSessions: number;
  completedSessions: number;
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
    metrics.daily.filter((d) => d.writingLines !== null).length > 0
      ? (
          metrics.daily.filter((d) => d.writingLines !== null).reduce((s, d) => s + (d.writingLines ?? 0), 0) /
          metrics.daily.filter((d) => d.writingLines !== null).length
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
          sub={`${metrics.completedSessions} / ${metrics.totalSessions} sessions`}
          color="bg-emerald-600"
        />
        <StatCard
          label="Avg Writing Lines"
          value={avgWritingLines}
          sub="lines per session"
          color="bg-green-600"
        />
        <StatCard
          label="Avg Language Confidence"
          value={avgConfidence}
          sub="out of 5"
          color="bg-orange-500"
        />
      </div>

      {metrics.totalSessions === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
          No data yet. Complete a few sessions to see your progress!
        </div>
      )}

      {/* Writing chart */}
      {metrics.daily.some((d) => d.writingLines !== null) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">✏️ Writing Progress</h2>
          <WritingChart data={metrics.daily} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Lines written, legibility, and effort (scale 0–5)
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
