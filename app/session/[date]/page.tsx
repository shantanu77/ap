"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import PhaseCard from "@/components/PhaseCard";
import { formatDisplayDate, todayString } from "@/lib/utils";
import type { DailyContent, PhaseId } from "@/types";
import { PHASES } from "@/types";
import Link from "next/link";

type PhaseStatus = "locked" | "ready" | "active" | "rating" | "done";

interface PhaseRatingRecord {
  phase: PhaseId;
  ratings: object;
  completed: boolean;
}

interface PlanData {
  id: string;
  date: string;
  content: DailyContent;
  editedContent?: DailyContent | null;
}

interface SessionData {
  id: string;
  status: "PENDING" | "PARTIAL" | "COMPLETE" | "MISSED";
  phases: PhaseRatingRecord[];
  notes?: string | null;
}

export default function SessionPage() {
  const params = useParams();
  const dateStr = params.date as string;
  const isToday = dateStr === todayString();

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [phaseStatuses, setPhaseStatuses] = useState<PhaseStatus[]>([
    "ready", "locked", "locked", "locked", "locked", "locked",
  ]);
  const [activePhaseIdx, setActivePhaseIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [markingMissed, setMarkingMissed] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Load plan and existing session
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load plan
        const planRes = await fetch(
          isToday ? "/api/plans/today" : `/api/plans/${dateStr}`
        );
        if (!planRes.ok) throw new Error("Failed to load plan");
        const planData: PlanData = await planRes.json();
        setPlan(planData);

        // Load existing session
        const sessRes = await fetch(`/api/sessions/${dateStr}`);
        if (sessRes.ok) {
          const sessData: SessionData | null = await sessRes.json();
          if (sessData) {
            setSession(sessData);
            setSessionStarted(true);
            if (sessData.status === "MISSED") {
              setPhaseStatuses(PHASES.map(() => "locked"));
              return;
            }
            // Reconstruct phase statuses from existing ratings
            const statuses: PhaseStatus[] = PHASES.map((phase) => {
              const done = sessData.phases.find(
                (p) => p.phase === phase.id && p.completed
              );
              return done ? "done" : "locked";
            });
            // Find first incomplete phase and set it ready
            const firstIncomplete = statuses.findIndex((s) => s !== "done");
            if (firstIncomplete >= 0 && firstIncomplete < PHASES.length) {
              statuses[firstIncomplete] = "ready";
            }
            setPhaseStatuses(statuses);
          }
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateStr, isToday]);

  const startSession = useCallback(async () => {
    if (sessionStarted) return;
    try {
      const res = await fetch(`/api/sessions/${dateStr}`, { method: "POST" });
      const data = await res.json();
      setSession(data);
      setSessionStarted(true);
    } catch {
      // session start error — non-fatal, continue
    }
  }, [dateStr, sessionStarted]);

  const handleActivate = useCallback(
    async (idx: number) => {
      if (!sessionStarted) await startSession();
      setPhaseStatuses((prev) => {
        const next = [...prev];
        next[idx] = "active";
        return next;
      });
      setActivePhaseIdx(idx);
    },
    [sessionStarted, startSession]
  );

  const handleSave = useCallback(
    async (idx: number, ratings: object, timeSpentSec: number) => {
      const phase = PHASES[idx];
      try {
        await fetch(`/api/sessions/${dateStr}/phase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: phase.id,
            ratings,
            completed: true,
            timeSpentSec,
          }),
        });
      } catch {
        // non-fatal
      }

      setPhaseStatuses((prev) => {
        const next = [...prev];
        next[idx] = "done";
        // Unlock next phase
        const nextIdx = idx + 1;
        if (nextIdx < PHASES.length && next[nextIdx] === "locked") {
          next[nextIdx] = "ready";
        }
        return next;
      });
      setActivePhaseIdx(null);
    },
    [dateStr]
  );

  const handleMarkMissed = useCallback(async () => {
    setMarkingMissed(true);
    setWarningMessage(null);
    try {
      const res = await fetch(`/api/sessions/${dateStr}/missed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Class skipped / session not attended.",
          notify: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark missed");
      setSession(data.session);
      setSessionStarted(true);
      setPhaseStatuses(PHASES.map(() => "locked"));
      setWarningMessage(
        data.emailSent
          ? "Skipped class marked. Warning email sent to the configured parent account."
          : `Skipped class marked. Warning email not sent: ${data.emailError || "email is not configured"}.`
      );
    } catch (err) {
      setWarningMessage(err instanceof Error ? err.message : "Failed to mark skipped class.");
    } finally {
      setMarkingMissed(false);
    }
  }, [dateStr]);

  const completedCount = phaseStatuses.filter((s) => s === "done").length;
  const allDone = completedCount === PHASES.length;
  const isMissed = session?.status === "MISSED";
  const content = plan?.editedContent ?? plan?.content;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">
          {isToday ? "Preparing tonight's session…" : "Loading session…"}
        </p>
      </div>
    );
  }

  if (error || !plan || !content) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-4xl">😕</p>
        <p className="text-gray-600">
          {error || "No plan found for this date."}
        </p>
        <Link href="/" className="text-indigo-600 underline text-sm">
          Go to today
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-800">
          {isToday ? "Tonight's Session 🌙" : "Session Review"}
        </h1>
        <p className="text-gray-500 text-sm">{formatDisplayDate(dateStr)}</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
          <span>Session Progress</span>
          <span className={allDone ? "text-green-600 font-bold" : ""}>
            {completedCount} / {PHASES.length} phases
            {allDone && " ✓ Complete!"}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              allDone ? "bg-green-500" : "bg-indigo-500"
            }`}
            style={{ width: `${(completedCount / PHASES.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {PHASES.map((p, i) => (
            <span
              key={p.id}
              className={`text-xs ${
                phaseStatuses[i] === "done" ? "text-green-500" : "text-gray-300"
              }`}
            >
              ●
            </span>
          ))}
        </div>
      </div>

      {warningMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          {warningMessage}
        </div>
      )}

      {isMissed && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <p className="font-bold text-red-800 text-lg">Skipped Class Recorded</p>
          <p className="text-red-600 text-sm mt-1">
            This day counts as absent in reports and attendance graphs.
          </p>
        </div>
      )}

      {/* All-done message */}
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-green-800 text-lg">Session Complete!</p>
          <p className="text-green-600 text-sm mt-1">
            Great work tonight, Aashvath. See you tomorrow at 9 PM!
          </p>
        </div>
      )}

      {/* Start prompt for today */}
      {isToday && !sessionStarted && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-indigo-800 font-semibold">Ready to start?</p>
          <p className="text-indigo-600 text-sm">
            Tap <strong>Start</strong> on Phase 1 to begin tonight&apos;s session.
          </p>
        </div>
      )}

      {!isToday && !allDone && !isMissed && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm">Skipped class?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mark today absent and send the configured warning email.
              </p>
            </div>
            <button
              onClick={handleMarkMissed}
              disabled={markingMissed}
              className="shrink-0 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {markingMissed ? "Sending..." : "Mark Skipped"}
            </button>
          </div>
        </div>
      )}

      {/* Phase cards */}
      <div className="space-y-4">
        {PHASES.map((phase, idx) => {
          const existingRating = session?.phases.find((p) => p.phase === phase.id) ?? null;
          return (
            <PhaseCard
              key={phase.id}
              phaseIndex={idx}
              status={phaseStatuses[idx]}
              existingRating={existingRating?.ratings}
              content={content}
              onActivate={() => handleActivate(idx)}
              onSave={(ratings, time) => handleSave(idx, ratings, time)}
              isReadOnly={!isToday || isMissed}
            />
          );
        })}
      </div>

      {/* Nav between days */}
      <div className="flex justify-between text-sm pt-2">
        <Link
          href={`/session/${getPrevDate(dateStr)}`}
          className="text-indigo-500 hover:text-indigo-700"
        >
          ← Previous day
        </Link>
        {!isToday && (
          <Link href="/" className="text-indigo-500 hover:text-indigo-700">
            Today →
          </Link>
        )}
      </div>
    </div>
  );
}

function getPrevDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}
