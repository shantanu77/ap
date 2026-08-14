"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import LessonRenderer from "@/components/genius/LessonRenderer";
import SavedLearningSummary from "@/components/genius/SavedLearningSummary";
import { GENIUS_QUESTION_MAX_LENGTH } from "@/lib/geniusLimits";
import type { GeniusContent, GeniusExplorationDTO, GeniusNode, GeniusSubject, StudyLevel } from "@/types/genius";

interface SavedExploration {
  id: string;
  displayTitle: string;
  defaultLevel: StudyLevel;
  content: GeniusContent;
  savedAt: string;
  subject: GeniusSubject;
}

export default function GeniusExplorer({ id, saved = false }: { id: string; saved?: boolean }) {
  const [exploration, setExploration] = useState<GeniusExplorationDTO | SavedExploration | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [question, setQuestion] = useState("");
  const [level, setLevel] = useState<StudyLevel>(6);
  const newestNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(saved ? `/api/genius/saved/${id}` : `/api/genius/explorations/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load this topic.");
        setExploration(data);
        setLevel(data.defaultLevel);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load this topic."))
      .finally(() => setLoading(false));
  }, [id, saved]);

  const expand = async (node: GeniusNode, label: string, intent: string, askedQuestion?: string) => {
    if (saved || action) return;
    setAction(label);
    setError("");
    setSavedNotice("");
    try {
      const response = await fetch(`/api/genius/explorations/${id}/expand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentNodeId: node.id,
          label,
          intent,
          level,
          question: askedQuestion,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not grow this idea.");
      setExploration(data);
      setQuestion("");
      window.setTimeout(() => newestNodeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not grow this idea.");
    } finally {
      setAction("");
    }
  };

  const saveTopic = async () => {
    if (saved || action) return;
    setAction("save");
    setError("");
    try {
      const response = await fetch(`/api/genius/explorations/${id}/save`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this topic.");
      setExploration(data);
      setSavedNotice("Saved! You can reopen every card and simulation without calling AI. 🔖");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this topic.");
    } finally {
      setAction("");
    }
  };

  const ask = (event: FormEvent) => {
    event.preventDefault();
    if (!exploration) return;
    const node = exploration.content.nodes.at(-1);
    if (!node || question.trim().length < 3) return;
    expand(node, question.trim(), `Answer this question about ${exploration.displayTitle}`, question.trim());
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="relative w-20 h-20">
          <span className="absolute inset-0 rounded-full border-4 border-violet-100" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
          <span className="absolute inset-0 grid place-items-center text-3xl">⚛️</span>
        </div>
        <p className="font-black text-slate-800 mt-5">{saved ? "Opening your saved discovery…" : "Gathering tiny ideas into a big explanation…"}</p>
        <p className="text-sm text-slate-400 mt-1">Drawing particle pictures 🎨</p>
      </div>
    );
  }

  if (error && !exploration) {
    return (
      <div className="rounded-3xl bg-white border border-rose-200 p-10 text-center">
        <p className="text-5xl">😕</p><p className="mt-4 text-slate-700">{error}</p>
        <Link href="/genius-corner" className="inline-block mt-4 rounded-xl bg-violet-600 text-white px-4 py-2 font-bold">Back to Genius Corner</Link>
      </div>
    );
  }

  if (!exploration) return null;
  const nodes = exploration.content.nodes;
  const savedContent = saved
    ? exploration.content
    : "savedSnapshot" in exploration
      ? exploration.savedSnapshot
      : null;
  const subjectEmoji = exploration.subject === "physics" ? "🚀" : exploration.subject === "biology" ? "🧬" : "⚗️";

  return (
    <div className="pb-16">
      <header className="sticky top-[64px] z-30 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200 mb-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={saved ? "/genius-corner/saved" : "/genius-corner"} className="text-xs font-bold text-violet-700 hover:underline">← {saved ? "Saved Topics" : "Genius Corner"}</Link>
            <h1 className="font-black text-slate-950 truncate max-w-xl">{exploration.displayTitle}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!saved && (
              <>
                <label className="rounded-xl bg-white border border-slate-200 px-2 py-1.5 text-xs text-slate-500">
                  Grade{" "}
                  <select value={level} onChange={(event) => setLevel(Number(event.target.value) as StudyLevel)} className="font-black text-slate-900 bg-transparent">
                    {[5, 6, 7, 8].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <button onClick={saveTopic} disabled={Boolean(action)} className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white px-3 py-2 text-xs font-black">
                  {action === "save" ? "Saving…" : "🔖 Save for Future"}
                </button>
              </>
            )}
            {saved && <Link href={`/genius-corner/${id}`} className="rounded-xl bg-violet-600 text-white px-3 py-2 text-xs font-black hover:bg-violet-700">Continue exploring 🚀</Link>}
          </div>
        </div>
      </header>

      {savedContent && <SavedLearningSummary nodes={savedContent.nodes} />}

      <nav aria-label="Exploration trail" className="rounded-2xl bg-white border border-slate-100 p-3 mb-8 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-black text-slate-400 mr-1">TRAIL</span>
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              {index > 0 && <span className="text-violet-300">→</span>}
              <a href={`#node-${node.id}`} className="rounded-full bg-violet-50 text-violet-800 px-3 py-1.5 text-xs font-bold hover:bg-violet-100 max-w-52 truncate">
                {index === 0 ? `${subjectEmoji} Start` : node.promptLabel || node.title}
              </a>
            </div>
          ))}
        </div>
      </nav>

      {saved && (
        <div className="mb-7 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900">
          <strong>Saved snapshot 🔖</strong> — this exact lesson is loaded from storage with no AI call.
        </div>
      )}
      {savedNotice && <div className="mb-7 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900">{savedNotice}</div>}
      {error && <div className="mb-7 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-900">{error}</div>}

      <div className="space-y-12">
        {nodes.map((node, nodeIndex) => (
          <div key={node.id} id={`node-${node.id}`} ref={nodeIndex === nodes.length - 1 ? newestNodeRef : undefined} className="scroll-mt-40">
            {nodeIndex > 0 && <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent mb-10" />}
            <LessonRenderer node={node} />

            {!saved && nodeIndex === nodes.length - 1 && (
              <section className="mt-6 rounded-3xl bg-violet-950 text-white p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Choose your next path</p>
                <h3 className="text-xl font-black mt-1">What should we uncover next? 🧠</h3>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  {node.exploreChoices.map((item) => (
                    <button key={item.id} onClick={() => expand(node, item.label, item.intent)} disabled={Boolean(action)} className="rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 disabled:opacity-50 p-4 text-left transition">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="block text-sm font-black mt-2">{item.label}</span>
                      {action === item.label && <span className="block text-xs text-cyan-200 mt-1">Growing this idea… ⚛️</span>}
                    </button>
                  ))}
                </div>
                <form onSubmit={ask} className="mt-4 flex flex-col sm:flex-row sm:items-end gap-2">
                  <label htmlFor="genius-question" className="sr-only">Ask about this topic</label>
                  <div className="min-w-0 flex-1">
                    <textarea id="genius-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="❓ Ask your own question about this…" maxLength={GENIUS_QUESTION_MAX_LENGTH} rows={3} className="block w-full resize-y rounded-xl bg-white text-slate-950 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400" />
                    <p className="mt-1 px-1 text-right text-[11px] text-slate-400">{question.length.toLocaleString()} / {GENIUS_QUESTION_MAX_LENGTH.toLocaleString()}</p>
                  </div>
                  <button disabled={Boolean(action) || question.trim().length < 3} className="rounded-xl bg-cyan-400 text-slate-950 px-5 py-3 text-sm font-black disabled:bg-slate-500 disabled:text-slate-300">Ask it ✨</button>
                </form>
              </section>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
