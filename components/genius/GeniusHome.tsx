"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SavedTopicSummary, StudyLevel } from "@/types/genius";

const collections = [
  { emoji: "🧊💧💨", title: "Matter around us", topic: "Why do solids, liquids, and gases behave differently?", color: "from-sky-400 to-blue-600" },
  { emoji: "⚛️", title: "Atoms & elements", topic: "What is an atom?", color: "from-violet-500 to-fuchsia-600" },
  { emoji: "🧂💧", title: "Mixtures & solutions", topic: "Why does salt disappear in water?", color: "from-cyan-400 to-teal-600" },
  { emoji: "🔥", title: "Chemical changes", topic: "Why does iron rust?", color: "from-orange-400 to-rose-600" },
  { emoji: "🍋🧼", title: "Acids & bases", topic: "What does pH measure?", color: "from-lime-400 to-emerald-600" },
  { emoji: "🏠", title: "Everyday chemistry", topic: "How does soap clean?", color: "from-amber-400 to-orange-600" },
];

export default function GeniusHome() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<StudyLevel>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<SavedTopicSummary[]>([]);

  useEffect(() => {
    const savedLevel = Number(localStorage.getItem("genius-study-level"));
    if ([5, 6, 7, 8].includes(savedLevel)) setLevel(savedLevel as StudyLevel);
    fetch("/api/genius/saved")
      .then((response) => response.ok ? response.json() : [])
      .then((items: SavedTopicSummary[]) => setRecent(items.slice(0, 3)))
      .catch(() => setRecent([]));
  }, []);

  const start = async (event?: FormEvent) => {
    event?.preventDefault();
    if (topic.trim().length < 3 || loading) return;
    setLoading(true);
    setError("");
    localStorage.setItem("genius-study-level", String(level));
    try {
      const response = await fetch("/api/genius/explorations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start this topic.");
      router.push(`/genius-corner/${data.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start this topic.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      <section className="relative rounded-[2rem] bg-slate-950 text-white p-6 sm:p-10 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute left-1/3 -bottom-20 w-56 h-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black tracking-widest uppercase text-cyan-200">Chemistry Lab of Ideas ⚗️</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">What are you curious about today? 🧠✨</h1>
          <p className="text-slate-300 mt-3 max-w-xl">Start with one question. Follow every “why.” Build, test, and see the invisible world of particles.</p>

          <form onSubmit={start} className="mt-7 rounded-2xl bg-white p-2 flex flex-col sm:flex-row gap-2 shadow-xl">
            <label className="sr-only" htmlFor="genius-topic">Chemistry topic</label>
            <input id="genius-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Try: Why does iron rust?" maxLength={120} className="min-w-0 flex-1 text-slate-900 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500" />
            <button disabled={loading || topic.trim().length < 3} className="rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white px-5 py-3 font-black whitespace-nowrap">
              {loading ? "Building your lesson… ⚛️" : "Start exploring 🚀"}
            </button>
          </form>
          {error && <p className="mt-3 rounded-xl bg-rose-500/20 border border-rose-400/30 p-3 text-sm text-rose-100">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="text-xs text-slate-400 mr-1">Study level</span>
            {([5, 6, 7, 8] as StudyLevel[]).map((item) => (
              <button key={item} type="button" onClick={() => setLevel(item)} className={`w-10 h-10 rounded-xl text-sm font-black transition ${level === item ? "bg-cyan-400 text-slate-950 scale-105" : "bg-white/10 hover:bg-white/20"}`} aria-pressed={level === item}>
                {item}
              </button>
            ))}
            <span className="text-xs text-cyan-200 ml-1">Grade {level}</span>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div><p className="text-xs font-black uppercase tracking-widest text-violet-600">Pick a portal</p><h2 className="text-2xl font-black text-slate-950">Chemistry collections</h2></div>
          <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-bold">6 worlds to explore</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <button
              key={collection.title}
              onClick={() => { setTopic(collection.topic); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`group min-h-40 rounded-3xl bg-gradient-to-br ${collection.color} text-white p-5 text-left shadow-sm hover:-translate-y-1 hover:shadow-xl transition`}
            >
              <p className="text-4xl">{collection.emoji}</p>
              <h3 className="font-black text-lg mt-4">{collection.title}</h3>
              <p className="text-xs text-white/75 mt-1 group-hover:text-white">Tap to load a starter question →</p>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-950">Your saved discoveries 🔖</h2>
            <Link href="/genius-corner/saved" className="text-sm font-bold text-violet-700 hover:underline">See all</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {recent.map((item) => (
              <Link key={item.id} href={`/genius-corner/saved/${item.id}`} className="rounded-2xl bg-white border border-violet-100 p-4 hover:border-violet-300 hover:shadow-md transition">
                <span className="text-2xl">{item.emoji}</span>
                <h3 className="font-black text-slate-900 mt-2 line-clamp-2">{item.displayTitle}</h3>
                <p className="text-xs text-slate-400 mt-2">Grade {item.defaultLevel} • {item.nodeCount} learning cards</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
