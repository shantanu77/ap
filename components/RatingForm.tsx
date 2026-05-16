"use client";
import { useState } from "react";
import type { PhaseId } from "@/types";

const StarRating = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`text-2xl transition-transform active:scale-110 ${
            n <= value ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  </div>
);

const YesNo = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all ${
            value === v
              ? v
                ? "bg-green-500 border-green-500 text-white"
                : "bg-red-400 border-red-400 text-white"
              : "border-gray-300 text-gray-500 hover:border-gray-400"
          }`}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  </div>
);

interface RatingFormProps {
  phase: PhaseId;
  onSave: (ratings: object) => void;
}

export default function RatingForm({ phase, onSave }: RatingFormProps) {
  const [mood, setMood] = useState(3);
  const [engagement, setEngagement] = useState(3);
  const [highlights, setHighlights] = useState("");
  const [readCompleted, setReadCompleted] = useState<boolean | null>(null);
  const [comprehension, setComprehension] = useState(0);
  const [interest, setInterest] = useState(3);
  const [langCompleted, setLangCompleted] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [langNotes, setLangNotes] = useState("");
  const [linesWritten, setLinesWritten] = useState(3);
  const [legibility, setLegibility] = useState(3);
  const [effort, setEffort] = useState(3);
  const [homeworkCompleteness, setHomeworkCompleteness] = useState(3);
  const [discipline, setDiscipline] = useState(3);
  const [shortcutUsage, setShortcutUsage] = useState<"none" | "minor" | "major">("none");
  const [bagPacked, setBagPacked] = useState<boolean | null>(null);
  const [goalSet, setGoalSet] = useState<boolean | null>(null);
  const [goal, setGoal] = useState("");

  const handleSave = () => {
    let ratings: object = {};
    switch (phase) {
      case "DAY_REVIEW":
        ratings = { mood, engagement, highlights };
        break;
      case "READ_ALOUD":
        ratings = { completed: readCompleted ?? false, comprehension, interest };
        break;
      case "LANGUAGE":
        ratings = { completed: langCompleted ?? false, confidence, notes: langNotes };
        break;
      case "WRITING":
        ratings = { linesWritten, legibility, effort };
        break;
      case "WORK_QUALITY":
        ratings = { homeworkCompleteness, discipline, shortcutUsage };
        break;
      case "NEXT_DAY_PREP":
        ratings = { bagPacked: bagPacked ?? false, goalSet: goalSet ?? false, goal };
        break;
    }
    onSave(ratings);
  };

  return (
    <div className="space-y-5 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-700">Rate this phase</h4>

      {phase === "DAY_REVIEW" && (
        <>
          <StarRating label="Mood today" value={mood} onChange={setMood} />
          <StarRating label="Engagement level" value={engagement} onChange={setEngagement} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Highlights / notes</label>
            <textarea
              className="w-full border rounded-lg p-2 text-sm text-gray-700 resize-none"
              rows={2}
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="What went well today at school?"
            />
          </div>
        </>
      )}

      {phase === "READ_ALOUD" && (
        <>
          <YesNo label="Completed the reading?" value={readCompleted} onChange={setReadCompleted} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Comprehension (questions answered correctly)
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setComprehension(n)}
                  className={`w-10 h-10 rounded-full text-sm font-bold border-2 transition-all ${
                    comprehension === n
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300 text-gray-500 hover:border-blue-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <StarRating label="Interest / engagement" value={interest} onChange={setInterest} />
        </>
      )}

      {phase === "LANGUAGE" && (
        <>
          <YesNo label="Completed the lesson?" value={langCompleted} onChange={setLangCompleted} />
          <StarRating label="Confidence after lesson" value={confidence} onChange={setConfidence} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Notes</label>
            <textarea
              className="w-full border rounded-lg p-2 text-sm text-gray-700 resize-none"
              rows={2}
              value={langNotes}
              onChange={(e) => setLangNotes(e.target.value)}
              placeholder="What was easy or hard?"
            />
          </div>
        </>
      )}

      {phase === "WRITING" && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Lines written (out of {3})</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setLinesWritten(n)}
                  className={`w-10 h-10 rounded-full text-sm font-bold border-2 transition-all ${
                    linesWritten === n
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 text-gray-500 hover:border-green-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <StarRating label="Legibility" value={legibility} onChange={setLegibility} />
          <StarRating label="Effort shown" value={effort} onChange={setEffort} />
        </>
      )}

      {phase === "WORK_QUALITY" && (
        <>
          <StarRating
            label="Homework completeness"
            value={homeworkCompleteness}
            onChange={setHomeworkCompleteness}
          />
          <StarRating label="Discipline / focus" value={discipline} onChange={setDiscipline} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              Shortcut usage (colors instead of writing)
            </label>
            <div className="flex gap-2">
              {(["none", "minor", "major"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setShortcutUsage(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 capitalize transition-all ${
                    shortcutUsage === s
                      ? s === "none"
                        ? "bg-green-500 border-green-500 text-white"
                        : s === "minor"
                        ? "bg-amber-400 border-amber-400 text-white"
                        : "bg-red-500 border-red-500 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {phase === "NEXT_DAY_PREP" && (
        <>
          <YesNo label="School bag packed?" value={bagPacked} onChange={setBagPacked} />
          <YesNo label="Mini-goal set for tomorrow?" value={goalSet} onChange={setGoalSet} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Tomorrow&apos;s goal</label>
            <input
              className="w-full border rounded-lg p-2 text-sm text-gray-700"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Pay attention in maths class"
            />
          </div>
        </>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 active:scale-95 transition-all"
      >
        Save &amp; Continue →
      </button>
    </div>
  );
}
