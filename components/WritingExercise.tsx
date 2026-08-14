"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/utils";
import type { WritingContent, WritingRating } from "@/types";

interface WritingExerciseProps {
  writing: WritingContent;
  durationMin: number;
  onSave: (rating: WritingRating, timeSpentSec: number) => void;
}

export default function WritingExercise({ writing, durationMin, onSave }: WritingExerciseProps) {
  const timeLimitSec = durationMin * 60;
  const startedAt = useRef(Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [doneWriting, setDoneWriting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [review, setReview] = useState<WritingRating | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (doneWriting) return;
    const interval = window.setInterval(
      () => setElapsedSec(Math.floor((Date.now() - startedAt.current) / 1000)),
      1000
    );
    return () => window.clearInterval(interval);
  }, [doneWriting]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const remaining = Math.max(0, timeLimitSec - elapsedSec);
  const overtime = Math.max(0, elapsedSec - timeLimitSec);

  const finishWriting = () => {
    setElapsedSec(Math.floor((Date.now() - startedAt.current) / 1000));
    setDoneWriting(true);
  };

  const analysePhoto = async () => {
    if (!photo) {
      setError("Take or upload a clear photo of the completed page first.");
      return;
    }
    setAnalysing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("prompt", writing.prompt);
      formData.append("linesRequired", String(writing.lines_required));
      formData.append("timeSpentSec", String(elapsedSec));
      formData.append("timeLimitSec", String(timeLimitSec));
      const response = await fetch("/api/writing/analyse", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not analyse the writing.");
      setReview(data as WritingRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse the writing.");
    } finally {
      setAnalysing(false);
    }
  };

  if (review) {
    return (
      <div className="mt-5 rounded-xl border border-green-200 bg-white p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-green-700">VISION REVIEW COMPLETE</p>
            <p className="text-sm text-gray-600">{review.summary}</p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-3xl font-black text-green-700">{review.score}</p>
            <p className="text-xs text-gray-500">out of 100</p>
          </div>
        </div>
        {review.timeDeduction > 0 && (
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
            Time score: −{review.timeDeduction} point{review.timeDeduction === 1 ? "" : "s"} for finishing {formatDuration(review.overtimeSec)} over the limit.
          </p>
        )}
        <Feedback title="Spelling" items={review.spellingMistakes} empty="No spelling mistakes found." />
        <Feedback title="Grammar" items={review.grammarMistakes} empty="No grammar mistakes found." />
        {review.structureFeedback.length > 0 && (
          <div><p className="text-sm font-bold text-gray-700">Sentence structure</p><ul className="list-disc pl-5 text-sm text-gray-600">{review.structureFeedback.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
        )}
        <p className="text-xs text-gray-500">This score will be saved for progress tracking. There is no rewrite requirement.</p>
        <button onClick={() => onSave(review, elapsedSec)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
          Save score &amp; continue →
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border bg-white p-4 space-y-4">
      {!doneWriting ? (
        <>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500">GRADE 6 WRITING TIME</p>
            <p className={`text-5xl font-mono font-bold tabular-nums ${overtime ? "text-red-600" : remaining <= 60 ? "text-amber-500" : "text-slate-800"}`}>
              {overtime ? `+${formatDuration(overtime)}` : formatDuration(remaining)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{overtime ? "Overtime is now reducing the score" : `${durationMin}-minute limit, adjusted for his grade and writing needs`}</p>
          </div>
          <button onClick={finishWriting} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">✓ Done writing</button>
        </>
      ) : (
        <>
          <div>
            <p className="font-bold text-gray-800">Upload the completed page</p>
            <p className="text-xs text-gray-500">Use a clear, well-lit photo showing the whole page. The image is analysed, but only the assessment is saved.</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-100 file:px-3 file:py-2 file:font-semibold file:text-green-700"
          />
          {previewUrl && <img src={previewUrl} alt="Writing page preview" className="max-h-72 w-full rounded-lg border object-contain" />}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button onClick={analysePhoto} disabled={!photo || analysing} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">
            {analysing ? "Analysing spelling, grammar and structure…" : "Analyse photo & give marks"}
          </button>
        </>
      )}
    </div>
  );
}

function Feedback({ title, items, empty }: { title: string; items: WritingRating["spellingMistakes"]; empty: string }) {
  return <div><p className="text-sm font-bold text-gray-700">{title}</p>{items.length === 0 ? <p className="text-sm text-green-700">{empty}</p> : <ul className="space-y-2 mt-1">{items.map((item, i) => <li key={i} className="rounded-lg bg-red-50 p-2 text-sm text-gray-700"><span className="line-through text-red-600">{item.written}</span> → <span className="font-semibold text-green-700">{item.correction}</span><p className="text-xs text-gray-600 mt-1">{item.explanation}</p></li>)}</ul>}</div>;
}
