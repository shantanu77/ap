"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";

interface SessionSummary {
  id: string;
  date: string;
  status: "PENDING" | "PARTIAL" | "COMPLETE" | "MISSED" | "NOT_ATTEMPTED";
  phases: { phase: string; completed: boolean }[];
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETE: "bg-green-500 text-white",
  PARTIAL: "bg-red-500 text-white",
  MISSED: "bg-red-700 text-white",
  NOT_ATTEMPTED: "bg-red-700 text-white",
  PENDING: "bg-gray-200 text-gray-500",
};

const STATUS_DOT: Record<string, string> = {
  COMPLETE: "bg-green-500",
  PARTIAL: "bg-red-500",
  MISSED: "bg-red-700",
  NOT_ATTEMPTED: "bg-red-700",
  PENDING: "bg-gray-200",
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sessionMap = new Map(sessions.map((s) => [s.date.split("T")[0], s]));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const prevMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Session History</h1>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            ‹
          </button>
          <h2 className="font-semibold text-gray-800">
            {format(viewMonth, "MMMM yyyy")}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-xs font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const session = sessionMap.get(dateStr);
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            const needsAttention = session?.status === "PARTIAL" || session?.status === "MISSED" || session?.status === "NOT_ATTEMPTED";
            const untouched = session?.status === "NOT_ATTEMPTED";

            return (
              <Link key={dateStr} href={`/session/${dateStr}`}>
                <div
                  className={`relative flex flex-col items-center min-h-12 p-1.5 rounded-xl cursor-pointer transition-colors ${
                    isToday ? "ring-2 ring-indigo-400" : ""
                  } ${untouched ? "bg-red-700 hover:bg-red-800 shadow-sm" : needsAttention ? "bg-red-100 border border-red-400 hover:bg-red-200" : session?.status === "COMPLETE" ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"} ${!isSameMonth(day, viewMonth) ? "opacity-30" : ""}`}
                >
                  <span className={`text-sm font-bold ${untouched ? "text-white" : needsAttention ? "text-red-800" : "text-gray-700"}`}>{format(day, "d")}</span>
                  {session && (
                    <span
                      className={`w-2 h-2 rounded-full mt-0.5 ${untouched ? "bg-white" : STATUS_DOT[session.status]}`}
                    />
                  )}
                  {!session && <span className="w-2 h-2 mt-0.5" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 justify-center">
          {[
            { color: "bg-green-500", label: "Complete" },
            { color: "bg-red-500", label: "Incomplete" },
            { color: "bg-red-700", label: "Not attempted / missed" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700">Recent Sessions</h2>
        {loading && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
        {!loading && sessions.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
            No sessions recorded yet. Start tonight!
          </div>
        )}
        {sessions.filter((s) => s.date.split("T")[0] <= format(new Date(), "yyyy-MM-dd")).slice(0, 20).map((s) => {
          const dateStr = s.date.split("T")[0];
          const completedPhases = s.phases.filter((p) => p.completed).length;
          return (
            <Link key={s.id} href={`/session/${dateStr}`}>
              <div className={`rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-all cursor-pointer ${s.status === "NOT_ATTEMPTED" || s.status === "MISSED" ? "bg-red-50 border-red-400" : s.status === "PARTIAL" ? "bg-red-50 border-red-300" : "bg-white border-gray-100 hover:border-indigo-200"}`}>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {format(parseISO(dateStr), "EEEE, MMM d, yyyy")}
                  </p>
                  <p className={`text-xs mt-0.5 ${s.status === "NOT_ATTEMPTED" ? "font-bold text-red-700" : "text-gray-400"}`}>
                    {s.status === "NOT_ATTEMPTED" ? "Not opened or attempted · 0 of 6 phases" : `${completedPhases} of 6 phases completed`}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLOR[s.status]}`}
                >
                  {s.status === "NOT_ATTEMPTED" ? "NOT ATTEMPTED" : s.status === "PARTIAL" ? "INCOMPLETE" : s.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
