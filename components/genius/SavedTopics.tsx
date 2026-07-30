"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SavedTopicSummary } from "@/types/genius";

export default function SavedTopics() {
  const [topics, setTopics] = useState<SavedTopicSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/genius/saved")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load saved topics.");
        setTopics(data);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load saved topics."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return needle ? topics.filter((topic) => `${topic.displayTitle} ${topic.canonicalTopic}`.toLowerCase().includes(needle)) : topics;
  }, [query, topics]);

  const remove = async (topic: SavedTopicSummary) => {
    if (!window.confirm(`Move “${topic.displayTitle}” out of Saved Topics?`)) return;
    const response = await fetch(`/api/genius/explorations/${topic.id}`, { method: "DELETE" });
    if (response.ok) setTopics((items) => items.filter((item) => item.id !== topic.id));
  };

  return (
    <div className="space-y-7 pb-12">
      <header className="rounded-[2rem] bg-gradient-to-br from-violet-700 to-indigo-950 text-white p-7 sm:p-9 shadow-xl">
        <Link href="/genius-corner" className="text-xs font-bold text-violet-200 hover:text-white">← Genius Corner</Link>
        <h1 className="text-3xl sm:text-4xl font-black mt-3">Saved Topics 🔖</h1>
        <p className="text-violet-200 mt-2">Your discoveries are ready to open—no AI call needed.</p>
        <label className="block mt-6">
          <span className="sr-only">Search saved topics</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="🔍 Search your discoveries…" className="w-full max-w-xl rounded-xl bg-white text-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-300/50" />
        </label>
      </header>

      {loading && <div className="text-center py-16 text-slate-400"><span className="text-4xl animate-pulse">⚛️</span><p className="mt-3">Opening your discovery shelf…</p></div>}
      {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-900">{error}</div>}
      {!loading && topics.length === 0 && (
        <div className="rounded-3xl bg-white border border-violet-100 p-10 text-center">
          <p className="text-5xl">🔖</p>
          <h2 className="font-black text-xl text-slate-900 mt-4">Your discovery shelf is waiting</h2>
          <p className="text-sm text-slate-500 mt-2">Explore a Chemistry topic, follow a few ideas, then save the whole journey here.</p>
          <Link href="/genius-corner" className="inline-block mt-5 rounded-xl bg-violet-600 text-white px-5 py-3 font-black">Start exploring 🚀</Link>
        </div>
      )}
      {!loading && topics.length > 0 && filtered.length === 0 && <p className="text-center text-slate-500 py-12">No saved topic matches “{query}”. 🔍</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((topic) => (
          <article key={topic.id} className="group rounded-3xl bg-white border border-violet-100 overflow-hidden hover:border-violet-300 hover:shadow-xl transition">
            <Link href={`/genius-corner/saved/${topic.id}`} className="block p-5">
              <div className="flex items-start justify-between">
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-violet-100 text-3xl">{topic.emoji}</span>
                <div className="flex gap-1">
                  {topic.hasSimulation && <span title="Contains a simulation" className="rounded-full bg-cyan-100 text-cyan-800 px-2 py-1 text-xs">🧪</span>}
                  <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-bold">Grade {topic.defaultLevel}</span>
                </div>
              </div>
              <h2 className="font-black text-lg text-slate-950 mt-4 group-hover:text-violet-700">{topic.displayTitle}</h2>
              <p className="text-xs text-slate-400 mt-2">{topic.nodeCount} learning {topic.nodeCount === 1 ? "card" : "cards"} • saved {new Date(topic.savedAt).toLocaleDateString()}</p>
            </Link>
            <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
              <Link href={`/genius-corner/${topic.id}`} className="text-xs font-black text-violet-700 hover:underline">Continue exploring →</Link>
              <button onClick={() => remove(topic)} className="text-xs text-slate-400 hover:text-rose-600" aria-label={`Delete ${topic.displayTitle}`}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
