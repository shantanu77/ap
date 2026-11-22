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

interface BoardSettings { activeDays: number[]; remindersEnabled: boolean; reminderEmail: string | null; reminderTime: string }

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
  const [pendingWork, setPendingWork] = useState<PendingWorkItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [boardSettings, setBoardSettings] = useState<BoardSettings>({ activeDays: [0, 2, 4], remindersEnabled: false, reminderEmail: "", reminderTime: "18:00" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");

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
    fetch("/api/board/settings").then((res) => res.ok ? res.json() : null).then((data) => { if (data) setBoardSettings(data); }).catch(() => undefined);
  }, []);

  const saveBoardSettings = async () => {
    setSettingsMessage("");
    try {
      const response = await fetch("/api/board/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(boardSettings) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Settings could not be saved.");
      setBoardSettings(data);
      setSettingsMessage("Settings saved! ✅");
    } catch (error) { setSettingsMessage(error instanceof Error ? error.message : "Settings could not be saved."); }
  };

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
        // non-fatal
      }

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
  const isPastCatchUp = !isToday && !allDone && session?.status !== "COMPLETE";
  const isEditable = isToday || isPastCatchUp;
  const isMissed = session?.status === "MISSED";
  const boardDayNumber = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const isScheduledBoardDay = boardSettings.activeDays.includes(boardDayNumber);
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
        <button type="button" aria-label="Board calendar settings" onClick={() => setSettingsOpen(!settingsOpen)} className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-xl shadow">⚙️</button>
        <h1 className="text-3xl font-black text-slate-800">
          {isToday ? "Tonight's Study Quest 🌙" : isPastCatchUp ? "Catch-up Quest" : "Session Review"}
        </h1>
        <p className="text-slate-600 text-base">{formatDisplayDate(dateStr)} · You&apos;ve got this, Aashvath! 🌟</p>
      </div>

      {settingsOpen && <div className="rounded-3xl border-2 border-indigo-200 bg-white p-5 shadow-sm space-y-4">
        <div><h2 className="text-xl font-black text-indigo-800">🗓️ Aashvath&apos;s Study Calendar</h2><p className="text-sm text-slate-600">Choose the days this board appears. Default: Sunday, Tuesday, Thursday.</p></div>
        <div className="flex flex-wrap gap-2">{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, index) => <label key={day} className={`cursor-pointer rounded-full px-3 py-2 font-bold ${boardSettings.activeDays.includes(index) ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}><input className="sr-only" type="checkbox" checked={boardSettings.activeDays.includes(index)} onChange={(event) => setBoardSettings((current) => ({ ...current, activeDays: event.target.checked ? [...current.activeDays, index].sort() : current.activeDays.filter((item) => item !== index) }))} />{day}</label>)}</div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={boardSettings.remindersEnabled} onChange={(event) => setBoardSettings((current) => ({ ...current, remindersEnabled: event.target.checked }))} className="h-5 w-5 accent-indigo-600" />Email a reminder</label>
        {boardSettings.remindersEnabled && <div className="grid gap-3 sm:grid-cols-2"><p className="text-sm font-semibold text-slate-700">Reminder email <span className="mt-1 block rounded-xl border bg-slate-50 p-2 font-normal">{boardSettings.reminderEmail || "Your verified sign-in email"}</span></p><label className="text-sm font-semibold text-slate-700">Reminder time<input type="time" value={boardSettings.reminderTime} onChange={(event) => setBoardSettings((current) => ({ ...current, reminderTime: event.target.value }))} className="mt-1 w-full rounded-xl border p-2" /></label></div>}
        <div className="flex items-center gap-3"><button type="button" onClick={() => void saveBoardSettings()} className="rounded-full bg-indigo-600 px-5 py-2 font-bold text-white">Save calendar ⚙️</button>{settingsMessage && <span className="text-sm font-semibold text-indigo-700">{settingsMessage}</span>}</div>
      </div>}

      {isToday && !isScheduledBoardDay && <div className="rounded-3xl border-2 border-sky-200 bg-sky-50 p-5 text-center"><p className="text-3xl">🌈🌿</p><p className="mt-1 text-lg font-black text-sky-800">Today is a rest day!</p><p className="text-sky-700">Your next Study Quest is on {getNextBoardDay(boardSettings.activeDays, boardDayNumber)}. Enjoy your day and come back then! 😊</p></div>}

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

      {content.targeted_practice && (
        <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black tracking-wide text-rose-700">{content.targeted_practice.report_level === "N" ? "PERSONAL PRACTICE FOCUS" : "TERM 1 REPORT FOCUS"}</p>
              <h2 className="mt-1 text-lg font-extrabold text-slate-800">
                {content.targeted_practice.subject}: {content.targeted_practice.skill}
              </h2>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              {content.targeted_practice.report_level === "N" ? "Practice goal" : `Report level ${content.targeted_practice.report_level} → Meeting`}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="text-xs font-bold text-gray-500">WHAT MEETING LOOKS LIKE</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {content.targeted_practice.meeting_target}
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="text-xs font-bold text-gray-500">TODAY&apos;S ACTION</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {content.targeted_practice.task}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.targeted_practice.success_criteria.map((criterion) => (
              <span key={criterion} className="rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-sm ring-1 ring-rose-100">
                ✓ {criterion}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-rose-700">
            This action is completed and tracked in the Work Quality phase as independent, with help, or unfinished.
          </p>
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

      {warningMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
          {warningMessage}
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
          <p className="font-black text-green-800 text-2xl">You did it, Aashvath!</p>
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
      {(!isToday || isScheduledBoardDay) && <div className="space-y-4">
        {PHASES.map((phase, idx) => {
          const existingRating = session?.phases.find((p) => p.phase === phase.id) ?? null;
          return (
            <PhaseCard
              key={phase.id}
              phaseIndex={idx}
              status={phaseStatuses[idx]}
              existingRating={existingRating?.ratings}
              content={sessionContent}
              onActivate={() => handleActivate(idx)}
              onSave={(ratings, time) => handleSave(idx, ratings, time)}
              isReadOnly={!isEditable}
            />
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
  if (ratings.targetedPracticeCompleted === false) {
    adjustments.push(`Complete today's ${content.targeted_practice?.skill ?? "report-based"} booster before starting a new practice task.`);
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
