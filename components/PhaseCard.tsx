"use client";
import { useState } from "react";
import Timer from "./Timer";
import RatingForm from "./RatingForm";
import type { DailyContent, PhaseId } from "@/types";
import { PHASES } from "@/types";

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-400 bg-amber-50",
  blue: "border-blue-400 bg-blue-50",
  orange: "border-orange-400 bg-orange-50",
  green: "border-green-400 bg-green-50",
  rose: "border-rose-400 bg-rose-50",
  purple: "border-purple-400 bg-purple-50",
};

const BADGE_MAP: Record<string, string> = {
  amber: "bg-amber-400",
  blue: "bg-blue-400",
  orange: "bg-orange-400",
  green: "bg-green-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const ICONS: Record<PhaseId, string> = {
  DAY_REVIEW: "🌅",
  READ_ALOUD: "📖",
  LANGUAGE: "🗣️",
  WRITING: "✏️",
  WORK_QUALITY: "📋",
  NEXT_DAY_PREP: "🎒",
};

type PhaseStatus = "locked" | "ready" | "active" | "rating" | "done";

interface PhaseCardProps {
  phaseIndex: number;
  status: PhaseStatus;
  existingRating?: object | null;
  content: DailyContent;
  onActivate: () => void;
  onSave: (ratings: object, timeSpentSec: number) => void;
  isReadOnly?: boolean;
}

function PhaseContent({ phaseId, content }: { phaseId: PhaseId; content: DailyContent }) {
  switch (phaseId) {
    case "DAY_REVIEW":
      return (
        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-700 mb-1">🔬 Science Hook</p>
            <p className="text-gray-700 text-sm italic">{content.science_hook}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">💭 Ethics Reflection</p>
            <p className="text-gray-700 text-sm">{content.ethics_reflection}</p>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Talk about your day — what was fun, what was hard, what you learned.
          </p>
        </div>
      );

    case "READ_ALOUD":
      return (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">{content.reading.title}</h3>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {content.reading.topic}
          </span>
          <div className="bg-white rounded-lg border border-blue-100 p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
              {content.reading.passage}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">COMPREHENSION QUESTIONS</p>
            {content.reading.comprehension_questions.map((q, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="font-bold text-blue-500 shrink-0">{i + 1}.</span>
                <span className="text-gray-700">{q}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "LANGUAGE":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                content.language.type === "hindi"
                  ? "bg-orange-100 text-orange-700"
                  : content.language.type === "sanskrit"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {content.language.type === "hindi"
                ? "🇮🇳 Hindi"
                : content.language.type === "sanskrit"
                ? "📜 Sanskrit"
                : "🔄 Review"}
            </span>
            <h3 className="font-bold text-gray-800">{content.language.lesson_title}</h3>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
              {content.language.content}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-700 mb-1">✏️ Practice Task</p>
            <p className="text-gray-700 text-sm">{content.language.practice_task}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">💡 Memory Tip</p>
            <p className="text-gray-700 text-sm italic">{content.language.remember_tip}</p>
          </div>
        </div>
      );

    case "WRITING":
      return (
        <div className="space-y-3">
          <div className="bg-white rounded-lg border-2 border-dashed border-green-300 p-4">
            <p className="text-xs font-semibold text-green-700 mb-2">COPY THIS NEATLY:</p>
            <p className="text-gray-800 leading-loose text-base whitespace-pre-line font-medium">
              {content.writing.prompt}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500">SUCCESS CRITERIA</p>
            {content.writing.success_criteria.map((c, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Target: {content.writing.lines_required} lines • Take your time, legibility matters
            more than speed
          </p>
        </div>
      );

    case "WORK_QUALITY":
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            Review today&apos;s school homework and classwork together.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            {[
              "Is every question attempted?",
              "Are answers written in full sentences (not just colors/diagrams)?",
              "Are subject notebooks organized?",
              "Is the handwriting readable?",
            ].map((q, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-rose-400 shrink-0">•</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "NEXT_DAY_PREP":
      return (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-700 mb-1">📅 Tomorrow&apos;s Tip</p>
            <p className="text-gray-700 text-sm">{content.next_day_tip}</p>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            {[
              "Pack school bag with tomorrow's books",
              "Check timetable for any PE / art materials",
              "Set one small goal for tomorrow",
              "Sleep by 10:30 PM",
            ].map((item, i) => (
              <div key={i} className="flex gap-2">
                <span>☐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );
  }
}

export default function PhaseCard({
  phaseIndex,
  status,
  existingRating,
  content,
  onActivate,
  onSave,
  isReadOnly,
}: PhaseCardProps) {
  const [showRating, setShowRating] = useState(status === "rating");
  const phase = PHASES[phaseIndex];
  const colors = COLOR_MAP[phase.color];
  const badge = BADGE_MAP[phase.color];
  const icon = ICONS[phase.id];
  const [elapsed, setElapsed] = useState(0);

  const handleTimerDone = (sec: number) => {
    setElapsed(sec);
    setShowRating(true);
  };

  const handleSave = (ratings: object) => {
    onSave(ratings, elapsed);
  };

  const isDone = status === "done" || (isReadOnly && existingRating);
  const isActive = status === "active";
  const isLocked = status === "locked";

  return (
    <div
      className={`rounded-2xl border-l-4 ${colors} p-5 transition-all ${
        isLocked ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-bold text-gray-800 text-base">{phase.label}</h3>
            <span className="text-xs text-gray-500">{phase.duration} minutes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDone && (
            <span className={`text-white text-xs px-2 py-1 rounded-full ${badge}`}>✓ Done</span>
          )}
          {isActive && (
            <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Active
            </span>
          )}
          {isLocked && <span className="text-gray-400 text-lg">🔒</span>}
          {status === "ready" && !isReadOnly && (
            <button
              onClick={onActivate}
              className={`text-white text-sm px-4 py-1.5 rounded-full ${badge} hover:opacity-90 active:scale-95 font-semibold`}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Content — always visible for done phases (read-only) or active phases */}
      {(isActive || isDone || isReadOnly) && (
        <div className="mt-3">
          <PhaseContent phaseId={phase.id} content={content} />
        </div>
      )}

      {/* Timer — shown when active and not yet done */}
      {isActive && !showRating && (
        <div className="mt-5 p-4 bg-white rounded-xl border">
          <Timer durationMin={phase.duration} onComplete={handleTimerDone} autoStart />
        </div>
      )}

      {/* Rating form */}
      {isActive && showRating && !isDone && (
        <div className="mt-4">
          <RatingForm phase={phase.id} onSave={handleSave} />
        </div>
      )}

      {/* Existing rating display (history / read-only) */}
      {isDone && existingRating && isReadOnly && (
        <div className="mt-3 text-xs text-gray-400 bg-white rounded-lg p-2">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(existingRating, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
