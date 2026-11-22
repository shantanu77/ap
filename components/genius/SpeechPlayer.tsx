"use client";

import { useEffect, useState } from "react";

type NarrationStatus = "idle" | "speaking" | "paused";

function preferredEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const englishVoices = voices.filter((voice) => /^en(?:-|$)/i.test(voice.lang));
  if (englishVoices.length === 0) return null;

  const score = (voice: SpeechSynthesisVoice) => {
    const language = voice.lang.toLowerCase().replaceAll("_", "-");
    const name = voice.name.toLowerCase();
    let value = language === "en-in" ? 1000 : 300;
    if (/neural|natural|premium|online/.test(name)) value += 100;
    if (/google|microsoft/.test(name)) value += 20;
    if (!voice.localService) value += 10;
    if (voice.default) value += 1;
    return value;
  };

  return englishVoices.sort((first, second) => score(second) - score(first))[0];
}

export default function SpeechPlayer({ text, label = "Listen to explanation" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<NarrationStatus>("idle");
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const available = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setSupported(available);
    if (!available) return;

    const synthesis = window.speechSynthesis;
    const updateVoices = () => setVoices(synthesis.getVoices());
    updateVoices();
    synthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      synthesis.removeEventListener("voiceschanged", updateVoices);
      synthesis.cancel();
    };
  }, [text]);

  const start = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSupported(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const availableVoices = window.speechSynthesis.getVoices();
    const selectedVoice = preferredEnglishVoice(availableVoices.length ? availableVoices : voices);
    if (selectedVoice) utterance.voice = selectedVoice;
    else {
      // With no English voice installed, explicitly retain the browser's default.
      utterance.voice = availableVoices.find((voice) => voice.default) ?? null;
    }
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
    setStatus("speaking");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setStatus("paused");
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setStatus("speaking");
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setStatus("idle");
  };

  if (!supported) {
    return <p className="text-xs text-slate-500" role="status">Audio reading is not supported in this browser.</p>;
  }

  if (status === "idle") {
    return (
      <button onClick={start} type="button" className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-50" aria-label={label}>
        🔊 {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Audio explanation controls">
      <span className="text-xs font-bold text-violet-700" aria-live="polite">{status === "paused" ? "Paused" : "Reading…"}</span>
      <button onClick={status === "paused" ? resume : pause} type="button" className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-50">
        {status === "paused" ? "▶ Resume" : "⏸ Pause"}
      </button>
      <button onClick={stop} type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
        ⏹ Stop
      </button>
    </div>
  );
}
