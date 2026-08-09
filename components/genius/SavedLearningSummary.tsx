import SpeechPlayer from "@/components/genius/SpeechPlayer";
import { learningSummaryForNodes, summaryNarrationForNodes } from "@/lib/geniusNarration";
import type { GeniusNode } from "@/types/genius";

export default function SavedLearningSummary({ nodes }: { nodes: GeniusNode[] }) {
  const sections = learningSummaryForNodes(nodes);
  if (sections.length === 0) return null;

  return (
    <section className="mb-8 rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-violet-50 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Saved learning summary</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">The big ideas to remember 🧠✨</h2>
          <p className="mt-1 text-sm text-slate-600">Start here when you return. These ideas are preserved with the saved lesson.</p>
        </div>
        <SpeechPlayer text={summaryNarrationForNodes(nodes)} label="Listen to summary" />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.nodeId} className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
            <h3 className="font-black text-violet-950">{section.title}</h3>
            <ul className="mt-2 space-y-2">
              {section.points.map((point, index) => (
                <li key={`${point}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-700"><span aria-hidden>⭐</span><span>{point}</span></li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
