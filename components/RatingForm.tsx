"use client";
import { useEffect, useRef, useState } from "react";
import type { DaySummaryRating, NextDayPrepContent, PhaseId, ReadingContent, ReadAloudAnswerRating, TargetedPracticeContent } from "@/types";

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
  writingLinesRequired?: number;
  reading?: ReadingContent;
  targetedPractice?: TargetedPracticeContent;
  nextDayPrep?: NextDayPrepContent;
  onSave: (ratings: object, timeSpentSec?: number) => void;
}

export default function RatingForm({
  phase,
  writingLinesRequired = 5,
  reading,
  targetedPractice,
  nextDayPrep,
  onSave,
}: RatingFormProps) {
  const [mood, setMood] = useState(3);
  const [engagement, setEngagement] = useState(3);
  const [highlights, setHighlights] = useState("");
  const [daySummary, setDaySummary] = useState<DaySummaryRating | null>(null);
  const [dayRecording, setDayRecording] = useState(false);
  const [dayRecorder, setDayRecorder] = useState<MediaRecorder | null>(null);
  const [dayRecordingSeconds, setDayRecordingSeconds] = useState(0);
  const dayRecordingStartedAt = useRef<number | null>(null);
  const [daySummaryError, setDaySummaryError] = useState<string | null>(null);
  const [reviewingDaySummary, setReviewingDaySummary] = useState(false);
  const [interest, setInterest] = useState(3);
  const [readAloudAnswers, setReadAloudAnswers] = useState<
    Array<ReadAloudAnswerRating | null>
  >(() => reading?.comprehension_questions.map(() => null) ?? []);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [readAloudError, setReadAloudError] = useState<string | null>(null);
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  const [langCompleted, setLangCompleted] = useState<boolean | null>(null);
  const [confidence, setConfidence] = useState(3);
  const [langNotes, setLangNotes] = useState("");
  const [linesWritten, setLinesWritten] = useState(3);
  const [legibility, setLegibility] = useState(3);
  const [effort, setEffort] = useState(3);
  const [homeworkCompleteness, setHomeworkCompleteness] = useState(3);
  const [discipline, setDiscipline] = useState(3);
  const [shortcutUsage, setShortcutUsage] = useState<"none" | "minor" | "major">("none");
  const [targetedPracticeCompleted, setTargetedPracticeCompleted] = useState<boolean | null>(null);
  const [targetedPracticeOutcome, setTargetedPracticeOutcome] = useState<"not_yet" | "with_help" | "independent">("not_yet");
  const [goal, setGoal] = useState("");
  const [focusClass, setFocusClass] = useState("");
  const [prepChecks, setPrepChecks] = useState<boolean[]>(
    () => nextDayPrep?.checklist.map(() => false) ?? []
  );
  const [nextDayPrepError, setNextDayPrepError] = useState<string | null>(null);
  const writingOptions = Array.from({ length: writingLinesRequired + 1 }, (_, index) => index);
  const readAloudQuestions = reading?.comprehension_questions ?? [];
  const verifiedAnswerCount = readAloudAnswers.filter(Boolean).length;
  const correctAnswerCount = readAloudAnswers.filter((answer) => answer?.correct).length;

  useEffect(() => {
    if (!dayRecording || dayRecordingStartedAt.current === null) return;
    const updateDuration = () => {
      if (dayRecordingStartedAt.current !== null) {
        setDayRecordingSeconds(
          Math.max(0, Math.floor((Date.now() - dayRecordingStartedAt.current) / 1000))
        );
      }
    };
    updateDuration();
    const interval = window.setInterval(updateDuration, 250);
    return () => window.clearInterval(interval);
  }, [dayRecording]);

  const startDaySummaryRecording = async () => {
    setDaySummaryError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      setDaySummary(null);
      setDayRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        const durationSec = dayRecordingStartedAt.current === null
          ? dayRecordingSeconds
          : Math.max(0, Math.floor((Date.now() - dayRecordingStartedAt.current) / 1000));
        stream.getTracks().forEach((track) => track.stop());
        dayRecordingStartedAt.current = null;
        setDayRecordingSeconds(durationSec);
        setDayRecorder(null);
        setDayRecording(false);
        await reviewDaySummary(new Blob(chunks, { type: recorder.mimeType }), durationSec);
      };

      dayRecordingStartedAt.current = Date.now();
      recorder.start();
      setDayRecorder(recorder);
      setDayRecording(true);
    } catch (err) {
      setDaySummaryError(err instanceof Error ? err.message : "Could not start recording.");
    }
  };

  const stopDaySummaryRecording = () => {
    if (dayRecorder && dayRecorder.state !== "inactive") {
      dayRecorder.stop();
    }
  };

  const reviewDaySummary = async (audioBlob: Blob, durationSec: number) => {
    setReviewingDaySummary(true);
    setDaySummaryError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "day-summary.webm");

      const res = await fetch("/api/day-review/summary", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not review the day summary.");

      setDaySummary({
        transcript: String(data.transcript ?? ""),
        summary: String(data.summary ?? ""),
        recordingDurationSec: durationSec,
        rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 1))) as 1 | 2 | 3 | 4 | 5,
        feedback: String(data.feedback ?? ""),
        betterSummary: String(data.betterSummary ?? ""),
        speakingTips: Array.isArray(data.speakingTips)
          ? data.speakingTips.map((tip: unknown) => String(tip)).filter(Boolean)
          : [],
        fillerWords: Array.isArray(data.fillerWords)
          ? data.fillerWords.map((word: unknown) => String(word)).filter(Boolean)
          : [],
        reviewedAt: new Date().toISOString(),
      });
    } catch (err) {
      setDaySummaryError(err instanceof Error ? err.message : "Could not review the day summary.");
    } finally {
      setReviewingDaySummary(false);
    }
  };

  const startRecording = async (questionIndex: number) => {
    if (!reading) return;

    setReadAloudError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setMediaRecorder(null);
        setRecordingIndex(null);
        await verifyRecording(questionIndex, new Blob(chunks, { type: recorder.mimeType }));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecordingIndex(questionIndex);
    } catch (err) {
      setReadAloudError(err instanceof Error ? err.message : "Could not start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const verifyRecording = async (questionIndex: number, audioBlob: Blob) => {
    if (!reading) return;

    setVerifyingIndex(questionIndex);
    setReadAloudError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `read-aloud-${questionIndex + 1}.webm`);
      formData.append("passage", reading.passage);
      formData.append("question", readAloudQuestions[questionIndex]);

      const res = await fetch("/api/read-aloud/verify", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify the answer.");

      const answer: ReadAloudAnswerRating = {
        question: readAloudQuestions[questionIndex],
        transcript: String(data.transcript ?? ""),
        correct: Boolean(data.correct),
        score: data.correct ? 1 : 0,
        rating: Math.min(5, Math.max(1, Math.round(Number(data.rating) || 1))) as 1 | 2 | 3 | 4 | 5,
        feedback: String(data.feedback ?? ""),
      };

      setReadAloudAnswers((prev) => {
        const next = [...prev];
        next[questionIndex] = answer;
        return next;
      });
    } catch (err) {
      setReadAloudError(err instanceof Error ? err.message : "Could not verify the answer.");
    } finally {
      setVerifyingIndex(null);
    }
  };

  const handleSave = () => {
    let ratings: object = {};
    switch (phase) {
      case "DAY_REVIEW":
        if (!daySummary) {
          setDaySummaryError("Aashvath must record and review his day summary before continuing.");
          return;
        }
        ratings = { mood, engagement, highlights, daySummary };
        break;
      case "READ_ALOUD":
        if (!reading || verifiedAnswerCount !== readAloudQuestions.length) {
          setReadAloudError("Aashvath must record and verify every answer before continuing.");
          return;
        }
        ratings = {
          completed: true,
          comprehension: correctAnswerCount,
          interest,
          answers: readAloudAnswers.filter(Boolean),
          verificationSummary: `${correctAnswerCount} of ${readAloudQuestions.length} answers verified correct`,
          verifiedAt: new Date().toISOString(),
        };
        break;
      case "LANGUAGE":
        ratings = { completed: langCompleted ?? false, confidence, notes: langNotes };
        break;
      case "WRITING":
        ratings = { linesWritten, legibility, effort };
        break;
      case "WORK_QUALITY":
        ratings = {
          homeworkCompleteness,
          discipline,
          shortcutUsage,
          ...(targetedPractice
            ? {
                targetedPracticeCompleted: targetedPracticeCompleted ?? false,
                targetedPracticeOutcome: targetedPracticeCompleted
                  ? targetedPracticeOutcome
                  : "not_yet",
              }
            : {}),
        };
        break;
      case "NEXT_DAY_PREP":
        if (nextDayPrep && prepChecks.some((checked) => !checked)) {
          setNextDayPrepError("Aashvath must personally tick every completed preparation action.");
          return;
        }
        if (!focusClass.trim() || !goal.trim()) {
          setNextDayPrepError("Answer both preparation questions before continuing.");
          return;
        }
        ratings = {
          bagPacked: nextDayPrep ? !nextDayPrep.is_school_day || prepChecks.every(Boolean) : false,
          goalSet: Boolean(goal.trim()),
          goal: goal.trim(),
          focusClass: focusClass.trim(),
          homeRoutineReady: prepChecks.every(Boolean),
          checklist: nextDayPrep?.checklist.map((item, index) => ({
            item,
            completed: Boolean(prepChecks[index]),
          })),
          allChecklistComplete: prepChecks.every(Boolean),
        };
        break;
    }
    onSave(ratings, phase === "DAY_REVIEW" ? daySummary?.recordingDurationSec : undefined);
  };

  const dayDurationClass = dayRecordingSeconds < 60
    ? "border-red-200 bg-red-50 text-red-700"
    : dayRecordingSeconds < 180
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-green-200 bg-green-50 text-green-700";

  const dayDurationLabel = dayRecordingSeconds < 60
    ? "Keep going — include each part below"
    : dayRecordingSeconds < 180
      ? "Good detail — aim for 3 minutes"
      : "Complete day review";

  const formatRecordingDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5 pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-700">
        {phase === "DAY_REVIEW" ? "Talk about your day" : "Rate this phase"}
      </h4>

      {phase === "DAY_REVIEW" && (
        <>
          <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-3">
            <div>
              <p className="font-bold text-gray-800">Use this five-part speaking path</p>
              <p className="mt-1 text-xs text-gray-500">Speak naturally. The prompts are hints, not questions to answer with one word.</p>
            </div>
            <ol className="space-y-2 text-sm text-gray-700">
              {[
                ["1", "The day", "Today started with… The main things that happened were…"],
                ["2", "One learning", "In ___ class I learned… One detail I remember is…"],
                ["3", "A challenge", "The difficult moment was… I responded by…"],
                ["4", "Work status", "I completed… I still need to finish… My materials are…"],
                ["5", "Tomorrow", "Tomorrow I will improve ___ by doing…"],
              ].map(([number, title, hint]) => (
                <li key={number} className="flex gap-3 rounded-lg bg-amber-50 p-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-white">{number}</span>
                  <span><strong>{title}:</strong> <span className="text-gray-600">{hint}</span></span>
                </li>
              ))}
            </ol>
            <div className={`rounded-xl border p-3 text-center ${dayDurationClass}`}>
              <p className="font-mono text-4xl font-black tabular-nums">
                {formatRecordingDuration(dayRecordingSeconds)}
              </p>
              <p className="mt-1 text-xs font-bold">{dayDurationLabel}</p>
              <p className="mt-1 text-[11px] opacity-80">Under 1 min: red · 1–3 min: yellow · 3+ min: green</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dayRecording ? (
                <button
                  type="button"
                  onClick={stopDaySummaryRecording}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold"
                >
                  Stop recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startDaySummaryRecording}
                  disabled={reviewingDaySummary || recordingIndex !== null}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {daySummary ? "Record day review again" : "Record day review"}
                </button>
              )}
              {reviewingDaySummary && (
                <span className="text-xs text-amber-700">Reviewing speech...</span>
              )}
              {daySummary && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${dayDurationClass}`}>
                  Recorded {formatRecordingDuration(daySummary.recordingDurationSec ?? dayRecordingSeconds)} · {daySummary.rating}/5
                </span>
              )}
            </div>
            {daySummary && (
              <div className="text-xs text-gray-600 space-y-2">
                <p>
                  <span className="font-semibold">Transcript:</span> {daySummary.transcript}
                </p>
                <p>
                  <span className="font-semibold">Summary:</span> {daySummary.summary}
                </p>
                <p>
                  <span className="font-semibold">Coaching:</span> {daySummary.feedback}
                </p>
                <p>
                  <span className="font-semibold">Say it better:</span> {daySummary.betterSummary}
                </p>
                {daySummary.fillerWords.length > 0 && (
                  <p>
                    <span className="font-semibold">Filler words noticed:</span>{" "}
                    {daySummary.fillerWords.join(", ")}
                  </p>
                )}
                {daySummary.speakingTips.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1">
                    {daySummary.speakingTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {daySummaryError && (
              <p className="text-sm font-semibold text-red-600">{daySummaryError}</p>
            )}
          </div>
          <StarRating label="Mood today" value={mood} onChange={setMood} />
          <StarRating label="Engagement level" value={engagement} onChange={setEngagement} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">Parent notes</label>
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
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Aashvath&apos;s recorded answers
              </label>
              <p className="text-xs text-gray-500 mt-1">
                No guest work. Each answer must be recorded by Aashvath, transcribed, and verified.
              </p>
            </div>
            {readAloudQuestions.map((question, index) => {
              const answer = readAloudAnswers[index];
              const isRecording = recordingIndex === index;
              const isVerifying = verifyingIndex === index;

              return (
                <div key={question} className="rounded-xl border border-blue-100 bg-white p-3 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {index + 1}. {question}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-semibold"
                      >
                        Stop recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRecording(index)}
                        disabled={recordingIndex !== null || isVerifying}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {answer ? "Record again" : "Record answer"}
                      </button>
                    )}
                    {isVerifying && <span className="text-xs text-blue-600">Transcribing...</span>}
                    {answer && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          answer.correct
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {answer.correct ? "Correct" : "Needs review"} · {answer.rating}/5
                      </span>
                    )}
                  </div>
                  {answer && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <span className="font-semibold">Transcript:</span> {answer.transcript}
                      </p>
                      <p>
                        <span className="font-semibold">Feedback:</span> {answer.feedback}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="text-sm font-semibold text-blue-700">
              Verified score: {correctAnswerCount} / {readAloudQuestions.length}
            </p>
            {readAloudError && (
              <p className="text-sm font-semibold text-red-600">{readAloudError}</p>
            )}
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
            <label className="text-sm font-medium text-gray-600">
              Lines written (out of {writingLinesRequired})
            </label>
            <div className="flex gap-2">
              {writingOptions.map((n) => (
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
          {targetedPractice && (
            <div className="rounded-xl border border-rose-100 bg-white p-3 space-y-3">
              <div>
                <p className="text-sm font-bold text-gray-700">Report-based booster</p>
                <p className="text-xs text-gray-500">
                  {targetedPractice.subject} · {targetedPractice.skill}
                </p>
              </div>
              <YesNo
                label="Completed the booster?"
                value={targetedPracticeCompleted}
                onChange={(value) => {
                  setTargetedPracticeCompleted(value);
                  if (!value) setTargetedPracticeOutcome("not_yet");
                }}
              />
              {targetedPracticeCompleted && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-600">How was it completed?</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      ["with_help", "With help"],
                      ["independent", "Independently"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTargetedPracticeOutcome(value)}
                        className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold ${
                          targetedPracticeOutcome === value
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-gray-300 text-gray-500"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
          {nextDayPrep && (
            <div className="space-y-3 rounded-xl border border-purple-200 bg-white p-4">
              <div>
                <p className="font-bold text-purple-800">{nextDayPrep.label}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {nextDayPrep.is_school_day
                    ? "School-day preparation"
                    : nextDayPrep.reason === "weekend"
                      ? "Weekend plan — no packing for tomorrow"
                      : "School holiday plan — no packing for tomorrow"}
                </p>
              </div>
              <p className="text-sm text-gray-700">{nextDayPrep.focus}</p>
              <div className="space-y-2">
                {nextDayPrep.checklist.map((item, index) => (
                  <label key={item} className="flex cursor-pointer gap-3 rounded-lg border border-purple-100 p-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(prepChecks[index])}
                      onChange={(event) => {
                        setPrepChecks((current) => current.map((checked, itemIndex) =>
                          itemIndex === index ? event.target.checked : checked
                        ));
                        setNextDayPrepError(null);
                      }}
                      className="mt-0.5 h-5 w-5 accent-purple-600"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              {nextDayPrep?.is_school_day ? "Which class needs your best focus?" : "Which useful activity will you focus on?"}
            </label>
            <input
              className="w-full border rounded-lg p-2 text-sm text-gray-700"
              value={focusClass}
              onChange={(e) => {
                setFocusClass(e.target.value);
                setNextDayPrepError(null);
              }}
              placeholder={nextDayPrep?.is_school_day
                ? "e.g. Maths — listen to the full instruction before starting"
                : "e.g. Finish the incomplete worksheet before screen time"}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">
              {nextDayPrep?.is_school_day ? "What is your next-school-day goal?" : "What is your day-off goal?"}
            </label>
            <input
              className="w-full border rounded-lg p-2 text-sm text-gray-700"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setNextDayPrepError(null);
              }}
              placeholder="e.g. When distracted, look back and write the next key point"
            />
          </div>
          {nextDayPrepError && <p className="text-sm font-semibold text-red-600">{nextDayPrepError}</p>}
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
