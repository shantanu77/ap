"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatDuration } from "@/lib/utils";

interface TimerProps {
  durationMin: number;
  onComplete: (elapsedSec: number) => void;
  autoStart?: boolean;
}

export default function Timer({ durationMin, onComplete, autoStart = false }: TimerProps) {
  const totalSec = durationMin * 60;
  const [remaining, setRemaining] = useState(totalSec);
  const [running, setRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const handleDone = useCallback(() => {
    stop();
    onComplete(elapsed);
  }, [stop, onComplete, elapsed]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            stop();
            onComplete(totalSec - r + 1 + elapsed);
            return 0;
          }
          setElapsed((e) => e + 1);
          return r - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, stop, onComplete, totalSec, elapsed]);

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
          ✓ Done
        </button>
      </div>
    </div>
  );
}
