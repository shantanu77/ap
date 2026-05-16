"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth } from "date-fns";

interface SessionSummary {
  id: string;
  date: string;
  status: "PENDING" | "PARTIAL" | "COMPLETE" | "MISSED";
  phases: { phase: string; completed: boolean }[];
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETE: "bg-green-500 text-white",
  PARTIAL: "bg-amber-400 text-white",
  MISSED: "bg-red-400 text-white",
  PENDING: "bg-gray-200 text-gray-500",
};

const STATUS_DOT: Record<string, string> = {
  COMPLETE: "bg-green-500",
  PARTIAL: "bg-amber-400",
  MISSED: "bg-red-400",
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

            return (
              <Link key={dateStr} href={`/session/${dateStr}`}>
                <div
                  className={`relative flex flex-col items-center p-1.5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? "ring-2 ring-indigo-400" : ""
                  } ${!isSameMonth(day, viewMonth) ? "opacity-30" : ""}`}
                >
                  <span className="text-sm font-medium text-gray-700">{format(day, "d")}</span>
                  {session && (
                    <span
                      className={`w-2 h-2 rounded-full mt-0.5 ${STATUS_DOT[session.status]}`}
                    />
                  )}
                  {!session && <span className="w-2 h-2 mt-0.5" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 text-xs text-gray-500 justify-center">
          {[
            { color: "bg-green-500", label: "Complete" },
            { color: "bg-amber-400", label: "Partial" },
            { color: "bg-red-400", label: "Missed" },
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
        {sessions.slice(0, 20).map((s) => {
          const dateStr = s.date.split("T")[0];
          const completedPhases = s.phases.filter((p) => p.completed).length;
          return (
            <Link key={s.id} href={`/session/${dateStr}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {format(parseISO(dateStr), "EEEE, MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {completedPhases} of 6 phases completed
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLOR[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
