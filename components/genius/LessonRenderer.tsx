"use client";

import { useEffect, useMemo, useState } from "react";
import ChemistryDiagram from "@/components/genius/ChemistryDiagram";
import ChemistrySimulation from "@/components/genius/ChemistrySimulation";
import type { GeniusBlock, GeniusNode } from "@/types/genius";

function QuickCheck({ block }: { block: Extract<GeniusBlock, { type: "quick_check" }> }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const correct = answer === block.correctIndex;
  return (
    <div className="rounded-3xl bg-amber-50 border-2 border-amber-200 p-5">
      <p className="text-xs font-black uppercase tracking-widest text-amber-700">Quick check 🤔</p>
      <h3 className="font-black text-slate-900 mt-1">{block.question}</h3>
      <div className="grid gap-2 mt-4">
        {block.options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            onClick={() => setAnswer(index)}
            className={`text-left rounded-xl border-2 p-3 text-sm font-semibold transition ${
              answer === index
                ? correct ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-amber-500 bg-white text-amber-950"
                : "border-amber-100 bg-white hover:border-amber-300"
            }`}
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 mr-2 text-xs">{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
      {answer !== null && (
        <p className={`mt-4 rounded-xl p-3 text-sm ${correct ? "bg-emerald-100 text-emerald-900" : "bg-white text-slate-700"}`}>
          <strong>{correct ? "You got it! 🌟" : "Good try—follow the clue 💡"}</strong>{" "}
          {block.explanation}
        </p>
      )}
    </div>
  );
}

type NarrationStatus = "idle" | "speaking" | "paused";

function narrationForNode(node: GeniusNode): string {
  const details: string[] = [];
  const recap: string[] = [];

  node.blocks.forEach((block) => {
    if (block.type === "hero") details.push(`Here is the big idea. ${block.hook}`);
    if (block.type === "paragraph") details.push(`${block.heading ? `${block.heading}. ` : ""}${block.text}`);
    if (block.type === "key_fact") details.push(`An important fact. ${block.title}. ${block.text}`);
    if (block.type === "steps") {
      details.push(`${block.title}. ${block.items.map((item, index) => `Step ${index + 1}. ${item.title}. ${item.text}`).join(" ")}`);
    }
    if (block.type === "comparison") {
      details.push(`${block.title}. Let us compare them. ${block.columns.map((column) => `${column.heading}. ${column.text}`).join(" ")}`);
    }
    if (block.type === "vocabulary") {
      details.push(`Useful words. ${block.terms.map((term) => `${term.term} means ${term.definition}${term.example ? ` For example, ${term.example}` : ""}`).join(" ")}`);
    }
    if (block.type === "analogy") {
      details.push(`Here is a helpful analogy. ${block.title}. ${block.text}${block.limit ? ` Remember where the analogy stops. ${block.limit}` : ""}`);
    }
    if (block.type === "diagram") {
      details.push(`Picture this. ${block.title}. ${block.caption}${block.labels?.length ? ` Look for ${block.labels.join(", ")}.` : ""}`);
    }
    if (block.type === "simulation") details.push(`Try the interactive model called ${block.title}. ${block.prompt}`);
    if (block.type === "quick_check") details.push(`Now pause for a quick check. ${block.question}`);
    if (block.type === "remember") recap.push(...block.points);
    if (block.type === "safety_note") details.push(`Safety note. ${block.text}`);
  });

  const summary = recap.length > 0 ? `To summarize, remember these ideas. ${recap.join(" ")}` : "";
  return [`Let us explore ${node.title}.`, ...details, summary].filter(Boolean).join(" ");
}

function ReadAloudButton({ node }: { node: GeniusNode }) {
  const [status, setStatus] = useState<NarrationStatus>("idle");
  const [supported, setSupported] = useState(true);
  const narration = useMemo(() => narrationForNode(node), [node]);

  useEffect(() => {
    setSupported("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => window.speechSynthesis?.cancel();
  }, [node.id]);

  const start = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSupported(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
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
      <button onClick={start} type="button" className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-800 hover:bg-violet-50" aria-label={`Read ${node.title} aloud`}>
        🔊 Listen to explanation
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Audio explanation controls">
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

function BlockRenderer({ block }: { block: GeniusBlock }) {
  if (block.type === "hero") {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-600 text-white p-6 sm:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute -right-8 -top-10 text-[9rem] opacity-10 rotate-12" aria-hidden>{block.emoji}</div>
        <p className="text-5xl relative">{block.emoji}</p>
        <p className="text-lg sm:text-xl font-black leading-snug mt-3 max-w-2xl relative">{block.hook}</p>
      </div>
    );
  }
  if (block.type === "paragraph") {
    return (
      <section className="rounded-3xl bg-white border border-slate-100 p-5 sm:p-6 shadow-sm">
        {block.heading && <h3 className="text-lg font-black text-slate-900 mb-2">{block.heading}</h3>}
        <p className="text-[15px] sm:text-base leading-7 text-slate-700">{block.text}</p>
      </section>
    );
  }
  if (block.type === "key_fact") {
    return (
      <section className="rounded-3xl bg-cyan-50 border-2 border-cyan-200 p-5 flex gap-4">
        <span className="text-3xl">{block.emoji || "💡"}</span>
        <div><h3 className="font-black text-cyan-950">{block.title}</h3><p className="text-sm leading-6 text-cyan-900 mt-1">{block.text}</p></div>
      </section>
    );
  }
  if (block.type === "steps") {
    return (
      <section className="rounded-3xl bg-white border border-violet-100 p-5 sm:p-6">
        <h3 className="font-black text-slate-900">{block.title}</h3>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {block.items?.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl bg-violet-50 p-4">
              <span className="text-2xl">{item.emoji}</span>
              <h4 className="font-black text-violet-950 mt-2">{item.title}</h4>
              <p className="text-sm text-violet-800 mt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (block.type === "comparison") {
    return (
      <section>
        <h3 className="font-black text-slate-900 mb-3">{block.title}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {block.columns?.map((column, index) => (
            <div key={`${column.heading}-${index}`} className="rounded-2xl bg-white border border-indigo-100 p-4 shadow-sm">
              {column.emoji && <p className="text-2xl">{column.emoji}</p>}
              <h4 className="font-black text-indigo-950 mt-1">{column.heading}</h4>
              <p className="text-sm text-slate-600 mt-1 leading-5">{column.text}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (block.type === "vocabulary") {
    return (
      <section className="rounded-3xl bg-fuchsia-50 border border-fuchsia-200 p-5">
        <h3 className="font-black text-fuchsia-950">Word power 📚</h3>
        <dl className="grid sm:grid-cols-2 gap-3 mt-3">
          {block.terms?.map((term, index) => (
            <div key={`${term.term}-${index}`} className="rounded-xl bg-white p-3">
              <dt className="font-black text-fuchsia-800">{term.term}</dt>
              <dd className="text-sm text-slate-600 mt-1">{term.definition}</dd>
              {term.example && <dd className="text-xs text-slate-400 italic mt-1">{term.example}</dd>}
            </div>
          ))}
        </dl>
      </section>
    );
  }
  if (block.type === "analogy") {
    return (
      <section className="rounded-3xl bg-amber-50 border border-amber-200 p-5">
        <h3 className="font-black text-amber-950">{block.title}</h3>
        <p className="text-sm leading-6 text-amber-900 mt-2">{block.text}</p>
        {block.limit && <p className="rounded-xl bg-white/80 p-3 text-xs text-slate-600 mt-3"><strong>Where this analogy stops 🛑</strong> {block.limit}</p>}
      </section>
    );
  }
  if (block.type === "diagram") return <ChemistryDiagram block={block} />;
  if (block.type === "simulation") return <ChemistrySimulation block={block} />;
  if (block.type === "quick_check") return <QuickCheck block={block} />;
  if (block.type === "remember") {
    return (
      <section className="rounded-3xl bg-emerald-50 border-2 border-emerald-200 p-5">
        <h3 className="font-black text-emerald-950">💡 Remember this</h3>
        <ul className="mt-3 space-y-2">
          {block.points?.map((point, index) => <li key={`${point}-${index}`} className="flex gap-2 text-sm text-emerald-900"><span>⭐</span><span>{point}</span></li>)}
        </ul>
      </section>
    );
  }
  if (block.type === "safety_note") {
    return <section className="rounded-3xl bg-rose-50 border-2 border-rose-200 p-5 text-sm text-rose-900"><strong>Safety shield 🛡️</strong><p className="mt-1">{block.text}</p></section>;
  }
  return null;
}

export default function LessonRenderer({ node }: { node: GeniusNode }) {
  return (
    <article className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {node.promptLabel && <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-1">You explored: {node.promptLabel}</p>}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{node.title}</h2>
          <p className="text-xs text-slate-400 mt-1">Grade {node.studyLevel} • about {node.estimatedReadMinutes} min</p>
        </div>
        <ReadAloudButton node={node} />
      </header>
      {node.blocks.map((block, index) => <BlockRenderer key={`${block.type}-${index}`} block={block} />)}
    </article>
  );
}
