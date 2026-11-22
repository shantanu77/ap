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
  lateCompletedAt?: string | null;
}

interface PendingWorkItem {
  date: string;
  status: "PENDING" | "PARTIAL" | "COMPLETE" | "MISSED";
  completedPhaseCount: number;
  missingPhaseLabels: string[];
  incompleteTasks: string[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [kidName, setKidName] = useState("there");
  const [pendingWork, setPendingWork] = useState<PendingWorkItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState([0, 2, 4]);

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data?.profile?.name) setKidName(data.profile.name); })
      .catch(() => undefined);
  }, []);

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
            if (sessData.status === "MISSED" && isToday) {
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

  useEffect(() => {
    if (!isToday) return;

    fetch("/api/sessions/pending")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: PendingWorkItem[]) => setPendingWork(items))
      .catch(() => setPendingWork([]));
  }, [isToday]);

  useEffect(() => {
    fetch(`/api/sessions/streak?date=${dateStr}`).then((res) => res.ok ? res.json() : { streak: 0 }).then((data) => setStreak(Number(data.streak) || 0)).catch(() => setStreak(0));
  }, [dateStr]);

  useEffect(() => {
    fetch("/api/board/settings").then((res) => res.ok ? res.json() : null).then((data) => { if (Array.isArray(data?.activeDays)) setActiveDays(data.activeDays); }).catch(() => undefined);
  }, []);

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
    },
    [sessionStarted, startSession]
  );

  const handleSave = useCallback(
    async (idx: number, ratings: object, timeSpentSec: number) => {
      const phase = PHASES[idx];
      try {
        const res = await fetch(`/api/sessions/${dateStr}/phase`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phase: phase.id,
            ratings,
            completed: true,
            timeSpentSec,
          }),
        });
        if (!res.ok) throw new Error("Failed to save phase");
      } catch {
        setSaveError("This part could not be saved. Check your connection and try again before continuing.");
        return;
      }

      setSaveError(null);

      setSession((previous) => {
        if (!previous) return previous;
        const nextPhase = { phase: phase.id, ratings, completed: true };
        return {
          ...previous,
          phases: [
            ...previous.phases.filter((item) => item.phase !== phase.id),
            nextPhase,
          ],
        };
      });

      setPhaseStatuses((prev) => {
        const next = [...prev];
        next[idx] = "done";
        // Continue straight to the next lesson after this part is saved.
        const nextIdx = idx + 1;
        if (nextIdx < PHASES.length && next[nextIdx] === "locked") {
          next[nextIdx] = "active";
        }
        return next;
      });
      const nextIdx = idx + 1;
      if (nextIdx < PHASES.length) {
        window.setTimeout(() => document.getElementById(`phase-card-${nextIdx}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    },
    [dateStr]
  );

  const completedCount = phaseStatuses.filter((s) => s === "done").length;
  const allDone = completedCount === PHASES.length;
  const isPastCatchUp = !isToday && !allDone && session?.status !== "COMPLETE";
  const isEditable = isToday || isPastCatchUp;
  const isMissed = session?.status === "MISSED";
  const boardDayNumber = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const isScheduledBoardDay = activeDays.includes(boardDayNumber);
  const content = plan?.editedContent ?? plan?.content;
  const primaryPendingWork = pendingWork[0];

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

  const sessionContent = applyTodayDisciplineToPrep(content, session);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative text-center space-y-1 rounded-3xl bg-gradient-to-r from-sky-100 via-purple-100 to-pink-100 px-4 py-5">
        <h1 className="px-7 text-2xl font-black leading-tight text-slate-800 sm:text-3xl">
          {isToday ? "Tonight's Study Quest 🌙" : isPastCatchUp ? "Catch-up Quest" : "Session Review"}
        </h1>
        <p className="text-sm text-slate-600 sm:text-base">{formatDisplayDate(dateStr)} · You&apos;ve got this, {kidName}! 🌟</p>
      </div>

      {isToday && !isScheduledBoardDay && <div className="rounded-3xl border-2 border-sky-200 bg-sky-50 p-5 text-center"><p className="text-3xl">🌈🌿</p><p className="mt-1 text-lg font-black text-sky-800">Today is a rest day!</p><p className="text-sky-700">Your next Study Quest is on {getNextBoardDay(activeDays, boardDayNumber)}. Enjoy your day and come back then! 😊</p></div>}

      {isToday && primaryPendingWork && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-red-800 font-extrabold text-base">Pending work needs attention first</p>
              <p className="text-red-700 text-sm mt-1">
                {formatDisplayDate(primaryPendingWork.date)} has{" "}
                <strong>{primaryPendingWork.incompleteTasks.length}</strong> unfinished item
                {primaryPendingWork.incompleteTasks.length === 1 ? "" : "s"}.
              </p>
              <p className="text-xs text-red-600 mt-1">
                {primaryPendingWork.incompleteTasks.slice(0, 3).join(", ")}
              </p>
            </div>
            <Link
              href={`/session/${primaryPendingWork.date}`}
              className="shrink-0 text-center px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"
            >
              Finish Pending Work
            </Link>
          </div>
          {pendingWork.length > 1 && (
            <p className="text-xs text-red-500 mt-3">
              {pendingWork.length - 1} more older day{pendingWork.length === 2 ? "" : "s"} also need review.
            </p>
          )}
        </div>
      )}

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

      {saveError && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800">
          {saveError}
        </div>
      )}

      {isMissed && !isPastCatchUp && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
          <p className="font-bold text-red-800 text-lg">Skipped Class Recorded</p>
          <p className="text-red-600 text-sm mt-1">
            This day counts as absent in reports and attendance graphs.
          </p>
        </div>
      )}

      {isPastCatchUp && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-bold text-amber-900 text-sm">Catch-up mode</p>
          <p className="text-amber-800 text-sm mt-1">
            Complete the unfinished phases from this old day. It will be recorded as completed late.
          </p>
        </div>
      )}

      {/* All-done message */}
      {allDone && (
        <div className="bg-gradient-to-br from-yellow-100 via-green-50 to-sky-100 border-2 border-green-300 rounded-3xl p-6 text-center shadow-sm">
          <p className="text-5xl mb-2">🎉🏆🌈</p>
          <p className="font-black text-green-800 text-2xl">You did it, {kidName}!</p>
          <p className="text-green-700 text-base mt-1">Today&apos;s tasks are complete. You earned a ⭐ Focus Star, 📚 Learning Champ, and 💪 Follow Through badge!</p>
          {streak >= 3 && <p className="mt-3 text-xl font-black text-orange-700">🔥 {streak}-day streak! {streak >= 15 ? "🏅 15-day Super Streak!" : streak >= 5 ? "🥇 5-day Streak Star!" : "🎯 3-day Streak Starter!"}</p>}
          {streak < 3 && <p className="mt-2 text-sm font-bold text-orange-700">✨ {3 - streak} more completed day{3 - streak === 1 ? "" : "s"} to your first 3-day streak reward!</p>}
        </div>
      )}

      {/* Start prompt for today */}
      {isToday && isScheduledBoardDay && !sessionStarted && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 text-center space-y-3">
          <p className="text-indigo-800 font-semibold">Ready to start?</p>
          <p className="text-indigo-600 text-sm">
            Tap <strong>Start</strong> on Phase 1 to begin tonight&apos;s session.
          </p>
        </div>
      )}

      {/* Phase cards */}
      {(!isToday || isScheduledBoardDay) && <div className="space-y-4">
        {PHASES.map((phase, idx) => {
          const existingRating = session?.phases.find((p) => p.phase === phase.id) ?? null;
          return (
            <div id={`phase-card-${idx}`} key={phase.id} className="scroll-mt-16">
            <PhaseCard
              phaseIndex={idx}
              status={phaseStatuses[idx]}
              existingRating={existingRating?.ratings}
              content={sessionContent}
              onActivate={() => handleActivate(idx)}
              onSave={(ratings, time) => handleSave(idx, ratings, time)}
              isReadOnly={!isEditable}
            />
            </div>
          );
        })}
      </div>}

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

function getNextBoardDay(activeDays: number[], fromDay: number) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (fromDay + offset) % 7;
    if (activeDays.includes(day)) return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day];
  }
  return "your next scheduled day";
}

function applyTodayDisciplineToPrep(content: DailyContent, session: SessionData | null): DailyContent {
  if (!content.next_day_prep) return content;
  const workQuality = session?.phases.find((phase) => phase.phase === "WORK_QUALITY");
  if (!workQuality?.completed) return content;

  const ratings = workQuality.ratings as Record<string, unknown>;
  const adjustments: string[] = [];
  const homeworkCompleteness = Number(ratings.homeworkCompleteness);
  const discipline = Number(ratings.discipline);

  if (Number.isFinite(homeworkCompleteness) && homeworkCompleteness < 3) {
    adjustments.push("Finish the incomplete homework identified today and verify every question before moving on.");
  }
  if (Number.isFinite(discipline) && discipline < 3) {
    adjustments.push("Write the exact first action for the task that lost focus today, then complete that action before leisure.");
  }
  if (ratings.shortcutUsage === "minor" || ratings.shortcutUsage === "major") {
    adjustments.push("Replace today's shortcut with one complete written answer that shows the reasoning explained aloud.");
  }
  if (adjustments.length === 0) return content;

  const checklist = [...new Set([...adjustments, ...content.next_day_prep.checklist])].slice(0, 6);
  return {
    ...content,
    next_day_prep: {
      ...content.next_day_prep,
      focus: `Repair today's unfinished or low-discipline work first. ${content.next_day_prep.focus}`,
      checklist,
    },
  };
}
