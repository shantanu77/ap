"use client";

import { useState } from "react";
import ChemistryDiagram from "@/components/genius/ChemistryDiagram";
import ChemistrySimulation from "@/components/genius/ChemistrySimulation";
import SpeechPlayer from "@/components/genius/SpeechPlayer";
import { narrationForNode } from "@/lib/geniusNarration";
import type { GeniusBlock, GeniusNode } from "@/types/genius";

function WorkedExample({ block }: { block: Extract<GeniusBlock, { type: "math_worked_example" }> }) {
  const [revealed, setRevealed] = useState(0);
  const steps = Array.isArray(block.steps) ? block.steps : [];
  return (
    <section className="rounded-3xl bg-blue-50 border-2 border-blue-200 p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-widest text-blue-700">Watch the method 👀</p>
      <h3 className="text-xl font-black text-slate-950 mt-1">{block.title}</h3>
      <p className="rounded-xl bg-white p-4 mt-3 font-bold text-slate-800">{block.problem}</p>
      <div className="space-y-3 mt-4">
        {steps.slice(0, revealed).map((step, index) => <div key={index} className="rounded-xl bg-white border border-blue-100 p-4"><p className="font-black text-blue-900">{step.label}</p><p className="font-mono text-slate-900 mt-1">{step.working}</p><p className="text-sm text-slate-600 mt-2"><strong>Why?</strong> {step.explanation}</p></div>)}
      </div>
      {revealed < steps.length ? <button onClick={() => setRevealed((value) => value + 1)} className="mt-4 rounded-xl bg-blue-600 text-white px-4 py-2 font-black">Reveal next step →</button> : <p className="mt-4 rounded-xl bg-emerald-100 text-emerald-900 p-3 font-black">Answer: {block.answer} ✓</p>}
    </section>
  );
}

function MathPractice({ block }: { block: Extract<GeniusBlock, { type: "math_practice" }> }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const steps = Array.isArray(block.steps) ? block.steps : [];
  const step = steps[stepIndex];
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
  const check = () => {
    if (!step) return;
    const acceptedAnswers = Array.isArray(step.acceptedAnswers) ? step.acceptedAnswers : [];
    const correct = acceptedAnswers.some((accepted) => normalize(String(accepted)) === normalize(answer));
    if (!correct) { setMessage(`Not yet. Hint: ${step.hint}`); return; }
    setMessage(`Correct — ${step.explanation}`);
    window.setTimeout(() => { setStepIndex((value) => value + 1); setAnswer(""); setMessage(""); }, 900);
  };
  const complete = stepIndex >= steps.length;
  return (
    <section className="rounded-3xl bg-emerald-950 text-white p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Solve it step by step ✏️</p>
      <h3 className="text-xl font-black mt-1">{block.title}</h3>
      <p className="rounded-xl bg-white/10 p-4 mt-3 font-bold">{block.problem}</p>
      {complete ? <div className="mt-4 rounded-xl bg-emerald-400 text-emerald-950 p-4"><p className="font-black">Solved! 🌟</p><p className="text-sm mt-1">Final answer: {block.finalAnswer}</p></div> : step && <div className="mt-4"><p className="text-sm font-bold">Step {stepIndex + 1} of {steps.length}: {step.prompt}</p><div className="flex flex-col sm:flex-row gap-2 mt-2"><input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") check(); }} className="flex-1 rounded-xl bg-white text-slate-950 px-4 py-3" placeholder="Enter this step's answer" /><button onClick={check} disabled={!answer.trim()} className="rounded-xl bg-cyan-400 text-slate-950 px-5 py-3 font-black disabled:opacity-50">Check step</button></div>{message && <p className="mt-3 rounded-xl bg-white/10 p-3 text-sm" aria-live="polite">{message}</p>}</div>}
    </section>
  );
}

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

function ReadAloudButton({ node }: { node: GeniusNode }) {
  return <SpeechPlayer text={narrationForNode(node)} label="Listen to explanation" />;
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
  if (block.type === "math_worked_example") return <WorkedExample block={block} />;
  if (block.type === "math_practice") return <MathPractice block={block} />;
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
