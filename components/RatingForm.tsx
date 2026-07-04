"use client";
import { useState } from "react";
import type { DaySummaryRating, PhaseId, ReadingContent, ReadAloudAnswerRating } from "@/types";

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
  onSave: (ratings: object) => void;
}

export default function RatingForm({
  phase,
  writingLinesRequired = 5,
  reading,
  onSave,
}: RatingFormProps) {
  const [mood, setMood] = useState(3);
  const [engagement, setEngagement] = useState(3);
  const [highlights, setHighlights] = useState("");
  const [daySummary, setDaySummary] = useState<DaySummaryRating | null>(null);
  const [dayRecording, setDayRecording] = useState(false);
  const [dayRecorder, setDayRecorder] = useState<MediaRecorder | null>(null);
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
  const [bagPacked, setBagPacked] = useState<boolean | null>(null);
  const [goalSet, setGoalSet] = useState<boolean | null>(null);
  const [goal, setGoal] = useState("");
  const writingOptions = Array.from({ length: writingLinesRequired + 1 }, (_, index) => index);
  const readAloudQuestions = reading?.comprehension_questions ?? [];
  const verifiedAnswerCount = readAloudAnswers.filter(Boolean).length;
  const correctAnswerCount = readAloudAnswers.filter((answer) => answer?.correct).length;

  const startDaySummaryRecording = async () => {
    setDaySummaryError(null);
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
        setDayRecorder(null);
        setDayRecording(false);
        await reviewDaySummary(new Blob(chunks, { type: recorder.mimeType }));
      };

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

  const reviewDaySummary = async (audioBlob: Blob) => {
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
          setDaySummaryError("Ashvath must record and review his day summary before continuing.");
          return;
        }
        ratings = { mood, engagement, highlights, daySummary };
        break;
      case "READ_ALOUD":
        if (!reading || verifiedAnswerCount !== readAloudQuestions.length) {
          setReadAloudError("Ashvath must record and verify every answer before continuing.");
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
          <div className="rounded-xl border border-amber-100 bg-white p-3 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Ashvath&apos;s spoken day summary
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Record what happened today, how it felt, and one thing to improve tomorrow.
              </p>
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
                  {daySummary ? "Record again" : "Record summary"}
                </button>
              )}
              {reviewingDaySummary && (
                <span className="text-xs text-amber-700">Reviewing speech...</span>
              )}
              {daySummary && (
                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">
                  Summary rating · {daySummary.rating}/5
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
                Ashvath&apos;s recorded answers
              </label>
              <p className="text-xs text-gray-500 mt-1">
                No guest work. Each answer must be recorded by Ashvath, transcribed, and verified.
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
