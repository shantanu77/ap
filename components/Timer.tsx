"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatDuration } from "@/lib/utils";

interface TimerProps {
  durationMin: number;
  onComplete: (elapsedSec: number) => void;
  autoStart?: boolean;
  doneLabel?: string;
}

export default function Timer({ durationMin, onComplete, autoStart = false, doneLabel = "✓ Done" }: TimerProps) {
  const totalSec = durationMin * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const callbackRef = useRef(onComplete);

  useEffect(() => { callbackRef.current = onComplete; }, [onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const handleDone = useCallback(() => {
    stop();
    callbackRef.current(elapsedRef.current);
  }, [stop]);

  useEffect(() => {
    if (running) {
      let previousTickAt = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSinceTick = Math.floor((now - previousTickAt) / 1000);
        if (elapsedSinceTick < 1) return;
        previousTickAt += elapsedSinceTick * 1000;
        const nextElapsed = Math.min(totalSec, elapsedRef.current + elapsedSinceTick);
        elapsedRef.current = nextElapsed;
        setElapsed(nextElapsed);
        setRemaining(Math.max(0, totalSec - nextElapsed));
        if (nextElapsed >= totalSec) {
          stop();
          callbackRef.current(nextElapsed);
        }
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, stop, totalSec]);

  const pct = Math.round(((totalSec - remaining) / totalSec) * 100);
  const isUrgent = remaining <= 60 && remaining > 0;

  return (
    <div className="text-center space-y-4">
      <div
        className={`text-6xl font-mono font-bold tabular-nums ${
          isUrgent ? "text-red-500 animate-pulse" : "text-slate-800"
        }`}
      >
        {formatDuration(remaining)}
      </div>

      {/* Progress ring approximated as bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-indigo-500 h-3 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-3 justify-center">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 active:scale-95"
          >
            {elapsed === 0 ? "▶ Start Timer" : "▶ Resume"}
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 active:scale-95"
          >
            ⏸ Pause
          </button>
        )}
        <button
          onClick={handleDone}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95"
        >
          {doneLabel}
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-600">⏱️ When you finish, press “{doneLabel.replace(/^✓\s*/, "")}”. You can stop early!</p>
    </div>
  );
}
