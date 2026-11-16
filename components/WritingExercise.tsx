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
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
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

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
    return () => cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

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
      if (!response.ok) {
        const evidence = Array.isArray(data.handwritingEvidence)
          ? data.handwritingEvidence.map((item: unknown) => String(item)).filter(Boolean).join(" ")
          : "";
        throw new Error([data.error || "Could not analyse the writing.", evidence].filter(Boolean).join(" "));
      }
      setReview(data as WritingRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse the writing.");
    } finally {
      setAnalysing(false);
    }
  };

  const openCamera = async () => {
    setCameraError(null);
    setPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setCameraStream(stream);
    } catch (error) {
      setCameraError(error instanceof Error && error.name === "NotAllowedError"
        ? "Camera access is needed to take the writing photo. Please allow camera access and try again."
        : "Could not open the camera. Check that this device has a camera and try again.");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("The camera is still starting. Please wait a moment and try again.");
      return;
    }
    setPreparingPhoto(true);
    setCameraError(null);
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Camera capture is unavailable.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await canvasToBlob(canvas, 0.9);
      const source = new File([blob], "writing-page-camera.jpg", { type: "image/jpeg", lastModified: Date.now() });
      setPhoto(await optimiseWritingPhoto(source));
      setCameraStream(null);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Could not capture this photo. Please try again.");
    } finally {
      setPreparingPhoto(false);
    }
  };

  const retakePhoto = async () => {
    setReview(null);
    setPhoto(null);
    await openCamera();
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
        <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-800">
          ✓ Handwriting verified · {review.handwritingConfidence}% confidence
        </div>
        {review.timeDeduction > 0 && (
          <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
            Time score: −{review.timeDeduction} point{review.timeDeduction === 1 ? "" : "s"} for finishing {formatDuration(review.overtimeSec)} over the limit.
          </p>
        )}
        <Feedback title="Spelling" items={review.spellingMistakes} empty="No spelling mistakes found." />
        <Feedback title="Grammar & punctuation" items={review.grammarMistakes} empty="No grammar or punctuation mistakes found." />
        {review.structureFeedback.length > 0 && (
          <div><p className="text-sm font-bold text-gray-700">Sentence structure</p><ul className="list-disc pl-5 text-sm text-gray-600">{review.structureFeedback.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
        )}
        {review.legibilityFeedback.length > 0 && (
          <div><p className="text-sm font-bold text-gray-700">Legibility</p><ul className="list-disc pl-5 text-sm text-gray-600">{review.legibilityFeedback.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
        )}
        {review.strengths.length > 0 && (
          <div><p className="text-sm font-bold text-green-700">What went well</p><ul className="list-disc pl-5 text-sm text-gray-600">{review.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
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
          <p className="text-xs font-semibold text-gray-500">✍️ PARAGRAPH WRITING TIME</p>
            <p className={`text-5xl font-mono font-bold tabular-nums ${overtime ? "text-red-600" : remaining <= 60 ? "text-amber-500" : "text-slate-800"}`}>
              {overtime ? `+${formatDuration(overtime)}` : formatDuration(remaining)}
            </p>
          <p className="text-xs text-gray-500 mt-1">{overtime ? "Overtime is now reducing the score" : `${durationMin} minutes · up to 100 words. Finish early? Press Done writing.`}</p>
          </div>
          <button onClick={finishWriting} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">✓ Done writing</button>
        </>
      ) : (
        <>
          <div>
            <p className="font-bold text-gray-800">📸 Take a photo of your finished page</p>
            <p className="text-xs text-gray-500">Use the camera here to show the whole page in good light. Gallery uploads are turned off. The photo is checked, but only the assessment is saved.</p>
          </div>
          {!cameraStream && !photo && <button type="button" onClick={() => void openCamera()} className="w-full rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700">Open camera 📷</button>}
          {cameraStream && <div className="space-y-2"><video ref={videoRef} autoPlay playsInline muted className="max-h-[65vh] w-full rounded-xl border bg-black object-contain" /><div className="flex gap-2"><button type="button" onClick={() => void capturePhoto()} disabled={preparingPhoto} className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-50">{preparingPhoto ? "Preparing photo…" : "Capture page 📸"}</button><button type="button" onClick={() => setCameraStream(null)} className="rounded-xl bg-slate-200 px-4 py-3 font-bold text-slate-700">Close</button></div></div>}
          {preparingPhoto && <p className="text-sm font-semibold text-green-700">Preparing a smaller high-contrast copy…</p>}
          {previewUrl && <img src={previewUrl} alt="Writing page preview" className="max-h-72 w-full rounded-lg border object-contain" />}
          {cameraError && <p className="text-sm font-semibold text-red-600">{cameraError}</p>}
          {photo && <button type="button" onClick={() => void retakePhoto()} className="w-full rounded-lg bg-slate-100 py-2 font-semibold text-slate-700">Retake photo</button>}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button onClick={analysePhoto} disabled={!photo || analysing || preparingPhoto} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">
            {analysing ? "Verifying handwriting and analysing the work…" : "Verify handwriting & give marks"}
          </button>
        </>
      )}
    </div>
  );
}

async function optimiseWritingPhoto(source: File): Promise<File> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const pixels = context.getImageData(0, 0, width, height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const gray = 0.2126 * pixels.data[index] + 0.7152 * pixels.data[index + 1] + 0.0722 * pixels.data[index + 2];
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.12 + 128));
    pixels.data[index] = contrasted;
    pixels.data[index + 1] = contrasted;
    pixels.data[index + 2] = contrasted;
  }
  context.putImageData(pixels, 0, 0);

  let quality = 0.82;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > 1_500_000 && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }
  return new File([blob], "writing-page.jpg", { type: "image/jpeg", lastModified: Date.now() });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image conversion failed.")), "image/jpeg", quality));
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Feedback({ title, items, empty }: { title: string; items: WritingRating["spellingMistakes"]; empty: string }) {
  return <div><p className="text-sm font-bold text-gray-700">{title}</p>{items.length === 0 ? <p className="text-sm text-green-700">{empty}</p> : <ul className="space-y-2 mt-1">{items.map((item, i) => <li key={i} className="rounded-lg bg-red-50 p-2 text-sm text-gray-700"><span className="line-through text-red-600">{item.written}</span> → <span className="font-semibold text-green-700">{item.correction}</span><p className="text-xs text-gray-600 mt-1">{item.explanation}</p></li>)}</ul>}</div>;
}
