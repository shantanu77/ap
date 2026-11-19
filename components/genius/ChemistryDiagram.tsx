"use client";

import { useEffect, useId, useState } from "react";
import type { ExtractedGeniusBlock } from "@/components/genius/types";

type DiagramBlock = ExtractedGeniusBlock<"diagram">;

const particles = [
  [18, 20], [42, 20], [66, 20], [90, 20],
  [18, 45], [42, 45], [66, 45], [90, 45],
  [18, 70], [42, 70], [66, 70], [90, 70],
];

function AtomDiagram({ activeLabel, activeIndex }: { activeLabel: string | null; activeIndex: number | null }) {
  const id = useId().replace(/:/g, "");
  const focusNucleus = Boolean(activeLabel && (/nucleus|proton|neutron|center/i.test(activeLabel) || (!/electron|shell|orbit/i.test(activeLabel) && (activeIndex ?? 0) % 2 === 0)));
  const focusElectron = Boolean(activeLabel && (/electron|shell|orbit/i.test(activeLabel) || (!/nucleus|proton|neutron|center/i.test(activeLabel) && (activeIndex ?? 0) % 2 === 1)));
  return (
    <svg viewBox="0 0 320 190" className="w-full h-auto" role="img" aria-label="Simplified atom model">
      <defs>
        <radialGradient id={`${id}-nucleus`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="95" rx="112" ry="45" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="7 7" />
      <ellipse cx="160" cy="95" rx="55" ry="86" fill="none" stroke={focusElectron ? "#facc15" : "#60a5fa"} strokeWidth={focusElectron ? 7 : 3} strokeDasharray="7 7" transform="rotate(35 160 95)" className="transition-all" />
      <ellipse cx="160" cy="95" rx="55" ry="86" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="7 7" transform="rotate(-35 160 95)" />
      <circle cx="160" cy="95" r="30" fill={`url(#${id}-nucleus)`} stroke={focusNucleus ? "#facc15" : "none"} strokeWidth="7" className="transition-all" />
      <text x="160" y="91" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">NUCLEUS</text>
      <text x="160" y="106" textAnchor="middle" className="fill-amber-900 text-[10px]">p⁺ + n⁰</text>
      {[[49, 95], [271, 95], [118, 30], [204, 159]].map(([x, y], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r={focusElectron ? 16 : 11} fill="#4f46e5" stroke={focusElectron ? "#facc15" : "none"} strokeWidth="4" className="transition-all" />
          <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold">e⁻</text>
        </g>
      ))}
    </svg>
  );
}

function ParticleStatesDiagram({ activeLabel, activeIndex }: { activeLabel: string | null; activeIndex: number | null }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="img" aria-label="Particle arrangements in solid, liquid, and gas">
      {[
        { name: "Solid 🧊", type: "solid", color: "bg-sky-500" },
        { name: "Liquid 💧", type: "liquid", color: "bg-indigo-500" },
        { name: "Gas 💨", type: "gas", color: "bg-fuchsia-500" },
      ].map((state, stateIndex) => {
        const selected = activeLabel ? activeLabel.toLowerCase().includes(state.type) || (!/solid|liquid|gas/i.test(activeLabel) && activeIndex !== null && activeIndex % 3 === stateIndex) : activeIndex === stateIndex;
        const hasSelection = activeLabel !== null || activeIndex !== null;
        return <div key={state.type} className={`rounded-xl bg-white/80 border p-2 transition-all duration-300 ${selected ? "border-amber-400 ring-4 ring-amber-200 scale-105 shadow-lg" : hasSelection ? "border-violet-100 opacity-45" : "border-violet-100"}`}>
          <div className="relative h-28 rounded-lg bg-slate-50 overflow-hidden">
            {particles.slice(0, state.type === "gas" ? 7 : 12).map(([x, y], index) => {
              const left = state.type === "solid" ? x - 7 : state.type === "liquid" ? x - 7 + (index % 3) * 4 : (index * 37) % 88;
              const top = state.type === "solid" ? y : state.type === "liquid" ? Math.min(83, y + (index % 2) * 10) : (index * 29) % 83;
              return <span key={index} className={`absolute w-3 h-3 rounded-full ${state.color}`} style={{ left: `${left}%`, top: `${top}%` }} />;
            })}
          </div>
          <p className="text-center text-xs font-bold text-slate-700 mt-2">{state.name}</p>
        </div>;
      })}
    </div>
  );
}

function RustDiagram({ activeLabel, activeIndex }: { activeLabel: string | null; activeIndex: number | null }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4" role="img" aria-label="Iron plus oxygen plus water creates the conditions for rusting">
      {[
        ["🔩", "Iron", "bg-slate-100"],
        ["💨", "Oxygen", "bg-sky-100"],
        ["💧", "Water", "bg-blue-100"],
      ].map(([emoji, label, color], index) => {
        const selected = activeLabel ? activeLabel.toLowerCase().includes(label.toLowerCase()) || (!/iron|oxygen|water/i.test(activeLabel) && activeIndex === index) : false;
        return (
        <div key={label} className="contents">
          <div className={`${color} rounded-2xl p-4 min-w-24 text-center border border-white shadow-sm transition-all ${selected ? "ring-4 ring-amber-400 scale-110" : activeLabel ? "opacity-45" : ""}`}>
            <div className="text-3xl">{emoji}</div>
            <p className="text-xs font-bold mt-1 text-slate-700">{label}</p>
          </div>
          {index < 2 && <span className="font-black text-violet-400">+</span>}
        </div>
      );})}
      <span className="font-black text-violet-400">→</span>
      <div className="bg-orange-100 rounded-2xl p-4 min-w-24 text-center border border-orange-200 shadow-sm">
        <div className="text-3xl">🟠</div>
        <p className="text-xs font-bold mt-1 text-orange-800">Rusting</p>
      </div>
    </div>
  );
}

function DissolvingDiagram({ activeLabel, activeIndex }: { activeLabel: string | null; activeIndex: number | null }) {
  const saltSelected = Boolean(activeLabel && (/salt|crystal|solute/i.test(activeLabel) || (!/spread|particle|solution|water/i.test(activeLabel) && (activeIndex ?? 0) % 2 === 0)));
  const spreadSelected = Boolean(activeLabel && (/spread|particle|solution|water/i.test(activeLabel) || (!/spread|particle|solution|water/i.test(activeLabel) && (activeIndex ?? 0) % 2 === 1)));
  return (
    <div className="grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className={`relative h-36 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-200 border-4 border-white shadow-inner overflow-hidden transition-all ${saltSelected ? "ring-4 ring-amber-400 scale-105" : activeLabel ? "opacity-50" : ""}`}>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-3 grid grid-cols-5 gap-0.5">
          {Array.from({ length: 20 }).map((_, index) => <i key={index} className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-400" />)}
        </span>
        <p className="absolute top-2 left-3 text-xs font-bold text-blue-700">Salt crystal</p>
      </div>
      <span className="text-2xl text-violet-500 text-center">→</span>
      <div className={`relative h-36 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-200 border-4 border-white shadow-inner overflow-hidden transition-all ${spreadSelected ? "ring-4 ring-cyan-400 scale-105" : activeLabel ? "opacity-50" : ""}`}>
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className={`absolute w-2.5 h-2.5 rounded-full ${index % 2 ? "bg-indigo-500" : "bg-amber-400"}`}
            style={{ left: `${8 + (index * 29) % 84}%`, top: `${12 + (index * 43) % 75}%` }}
          />
        ))}
        <p className="absolute top-2 left-3 text-xs font-bold text-blue-700 bg-white/80 rounded px-1">Spread-out particles</p>
      </div>
    </div>
  );
}

function ReactionDiagram({ activeIndex }: { activeIndex: number | null }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3 text-center">
      {[
        ["👀", "Observe", "Notice the evidence"],
        ["⚛️", "Model", "Picture the particles"],
        ["🔮", "Predict", "Test another case"],
      ].map(([emoji, label, description], index) => (
        <div key={label} className={`relative rounded-2xl p-4 border transition-all duration-300 ${activeIndex === index ? "bg-cyan-100 border-cyan-500 scale-105 ring-2 ring-cyan-200" : activeIndex !== null ? "bg-white border-violet-100 opacity-50" : "bg-white border-violet-100"}`}>
          <p className="text-3xl">{emoji}</p>
          <p className="font-black text-violet-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
          {index < 2 && <span className="hidden sm:block absolute -right-5 top-1/2 text-violet-400 text-xl z-10">→</span>}
        </div>
      ))}
    </div>
  );
}

function ConceptMap({ labels, activeIndex, onSelect }: { labels: string[]; activeIndex: number | null; onSelect: (index: number) => void }) {
  const [center = "Chemistry idea", ...branches] = labels;
  const visibleBranches = branches.slice(0, 5);
  return (
    <div className="relative min-h-72 grid place-items-center py-3" role="group" aria-label={`Interactive concept map: ${labels.join(", ")}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden>
        {visibleBranches.map((_, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(1, visibleBranches.length) - Math.PI / 2;
          const x = 300 + Math.cos(angle) * 215;
          const y = 150 + Math.sin(angle) * 105;
          const active = activeIndex === index + 1;
          return <line key={index} x1="300" y1="150" x2={x} y2={y} stroke={active ? "#7c3aed" : "#a78bfa"} strokeWidth={active ? 7 : 3} strokeDasharray={active ? undefined : "7 6"} className="transition-all duration-300" />;
        })}
      </svg>
      <div className={`relative z-10 rounded-3xl text-white p-5 max-w-52 text-center shadow-xl border-4 border-white transition-all duration-300 ${activeIndex === 0 ? "bg-cyan-600 scale-110 ring-4 ring-cyan-200" : "bg-violet-700"}`}>
        <span className="text-2xl">⚗️</span>
        <p className="font-black leading-tight mt-1">{center}</p>
      </div>
      {visibleBranches.map((label, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, visibleBranches.length) - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 38;
        const top = 50 + Math.sin(angle) * 37;
        const active = activeIndex === index + 1;
        return (
          <button
            key={`${label}-${index}`}
            type="button"
            onClick={() => onSelect(index + 1)}
            className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 px-3 py-2 text-center text-xs sm:text-sm font-bold shadow-sm max-w-40 transition-all duration-300 ${active ? "bg-cyan-100 border-cyan-500 text-cyan-950 scale-110 ring-2 ring-cyan-200" : "bg-white border-violet-200 text-violet-950"}`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {["👀", "⚛️", "🔍", "🌍", "💡"][index]} {label}
          </button>
        );
      })}
    </div>
  );
}

function GravityDiagram() {
  const [mode, setMode] = useState<"drop" | "moon" | "distance">("drop");
  const id = useId().replace(/:/g, "");
  const isMoon = mode === "moon";
  const objectX = mode === "distance" ? 278 : 210;
  const earthRadius = isMoon ? 46 : 76;
  const pullLength = mode === "distance" ? 33 : isMoon ? 58 : 95;
  const description = mode === "drop"
    ? "Release the object: gravity pulls it toward Earth."
    : mode === "moon"
      ? "The Moon has less mass than Earth, so its surface gravity is weaker."
      : "Move farther away: the gravitational pull becomes weaker.";
  return (
    <div className="rounded-3xl bg-slate-950 p-4 sm:p-6 text-white" aria-label="Interactive gravity model">
      <div className="flex flex-wrap gap-2 justify-center mb-5">
        <button type="button" onClick={() => setMode("drop")} aria-pressed={mode === "drop"} className={`rounded-full px-4 py-2 text-sm font-black ${mode === "drop" ? "bg-cyan-300 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}>🍎 Drop an object</button>
        <button type="button" onClick={() => setMode("moon")} aria-pressed={mode === "moon"} className={`rounded-full px-4 py-2 text-sm font-black ${mode === "moon" ? "bg-cyan-300 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}>🌙 Compare with the Moon</button>
        <button type="button" onClick={() => setMode("distance")} aria-pressed={mode === "distance"} className={`rounded-full px-4 py-2 text-sm font-black ${mode === "distance" ? "bg-cyan-300 text-slate-950" : "bg-white/10 hover:bg-white/20"}`}>↔️ Move farther away</button>
      </div>
      <svg viewBox="0 0 420 250" className="w-full h-auto" role="img" aria-label={`${isMoon ? "Moon" : "Earth"} gravity model; ${mode === "distance" ? "object farther away with weaker pull" : "object pulled toward the planet"}`}>
        <defs><radialGradient id={`${id}-planet`}><stop stopColor={isMoon ? "#cbd5e1" : "#67e8f9"} /><stop offset="1" stopColor={isMoon ? "#475569" : "#1d4ed8"} /></radialGradient><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#fbbf24" /></marker></defs>
        <ellipse cx="170" cy="145" rx="130" ry="75" fill="none" stroke="#64748b" strokeDasharray="5 7" opacity=".65" />
        <circle cx="170" cy="145" r={earthRadius} fill={`url(#${id}-planet)`} className="transition-all duration-500" />
        <text x="170" y="150" textAnchor="middle" fill="#082f49" fontSize="14" fontWeight="900">{isMoon ? "MOON" : "EARTH"}</text>
        <g className="transition-all duration-500" transform={`translate(${objectX} ${mode === "drop" ? 54 : 80})`}><circle r="17" fill="#fb923c" /><text y="5" textAnchor="middle" fontSize="17">🍎</text></g>
        <line x1={objectX} y1={mode === "drop" ? 78 : 103} x2={objectX} y2={Math.max(110, 145 - earthRadius)} stroke="#fbbf24" strokeWidth="4" markerEnd={`url(#${id}-arrow)`} className="transition-all duration-500" />
        <text x="335" y="53" textAnchor="middle" fill="#67e8f9" fontSize="13" fontWeight="800">GRAVITY PULL</text>
        <line x1="405" y1="68" x2={405 - pullLength} y2="68" stroke="#fbbf24" strokeWidth="6" markerEnd={`url(#${id}-arrow)`} className="transition-all duration-500" />
        <text x="335" y="103" textAnchor="middle" fill="#cbd5e1" fontSize="12">{mode === "distance" ? "weaker" : isMoon ? "weaker here" : "stronger here"}</text>
      </svg>
      <p className="mt-2 rounded-xl bg-white/10 p-3 text-center text-sm font-semibold" aria-live="polite">{description}</p>
      <p className="mt-2 text-center text-[11px] text-slate-400">Illustration only; arrow length shows relative pull, not a measured value.</p>
    </div>
  );
}

function CompoundFormationDiagram({ labels }: { labels: string[] }) {
  const [selected, setSelected] = useState(0);
  const markerId = useId().replace(/:/g, "") + "compound-arrow";
  const makesMolecule = selected >= 2;
  const isHydrogen = selected === 0;
  const isOxygen = selected === 1;
  const isBond = selected === 3;
  const activeLabel = labels[selected];
  const atom = (cx: number, cy: number, kind: "H" | "O", highlighted: boolean, key: string) => (
    <g key={key} className="transition-all duration-500">
      <circle cx={cx} cy={cy} r={kind === "O" ? 28 : 21} fill={kind === "O" ? "#fb7185" : "#38bdf8"} stroke={highlighted ? "#facc15" : "#fff"} strokeWidth={highlighted ? 7 : 3} className="transition-all duration-300" />
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#082f49" fontSize="17" fontWeight="900">{kind}</text>
    </g>
  );
  return (
    <div className="rounded-3xl bg-slate-950 p-4 sm:p-6 text-white">
      <p className="text-center text-sm font-bold text-cyan-100 mb-3">Tap a label: the atoms and bonds in the model will respond.</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {labels.slice(0, 6).map((label, index) => <button key={`${label}-${index}`} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`rounded-full px-3 py-2 text-xs sm:text-sm font-black transition ${selected === index ? "bg-cyan-300 text-slate-950 ring-2 ring-cyan-100" : "bg-white/10 hover:bg-white/20"}`}>{label}</button>)}
      </div>
      <svg viewBox="0 0 600 250" className="w-full h-auto" role="img" aria-label={`Interactive model focusing on ${activeLabel}; atoms combine to form a water molecule`}>
        <text x="125" y="35" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontWeight="800">ATOMS BEFORE</text>
        <text x="470" y="35" textAnchor="middle" fill="#cbd5e1" fontSize="14" fontWeight="800">WATER MOLECULE</text>
        {atom(75, 130, "H", isHydrogen, "h1-before")}{atom(155, 130, "H", isHydrogen, "h2-before")}{atom(115, 190, "O", isOxygen, "o-before")}
        <path d="M210 130 H340" stroke="#a78bfa" strokeWidth="5" strokeDasharray="8 8" markerEnd={`url(#${markerId})`} />
        <defs><marker id={markerId} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#a78bfa" /></marker></defs>
        <line x1="430" y1="125" x2="485" y2="125" stroke={isBond ? "#facc15" : "#e2e8f0"} strokeWidth={isBond ? 12 : 7} className="transition-all duration-300" />
        <line x1="485" y1="125" x2="540" y2="125" stroke={isBond ? "#facc15" : "#e2e8f0"} strokeWidth={isBond ? 12 : 7} className="transition-all duration-300" />
        {atom(420, 125, "H", makesMolecule && (selected === 2 || isHydrogen), "h1-water")}{atom(485, 125, "O", makesMolecule && (selected === 2 || isOxygen), "o-water")}{atom(550, 125, "H", makesMolecule && (selected === 2 || isHydrogen), "h2-water")}
        <text x="300" y="225" textAnchor="middle" fill="#bae6fd" fontSize="13">The glowing outline tracks your selected part: {activeLabel}</text>
      </svg>
      <p className="rounded-xl bg-white/10 p-3 text-center text-sm" aria-live="polite">
        {selected === 0 ? "Hydrogen atoms are the two smaller blue atoms in the model." : selected === 1 ? "Oxygen is the larger pink atom; one oxygen joins with two hydrogen atoms in each water molecule." : selected === 2 ? "A water molecule has two hydrogen atoms bonded to one oxygen atom: H₂O." : "Chemical bonds hold the atoms together in a molecule; they are not drawn to scale."}
      </p>
    </div>
  );
}

function ProcessDiagram({ labels, activeIndex, activeLabel }: { labels: string[]; activeIndex: number | null; activeLabel: string | null }) {
  return (
    <div className="grid sm:grid-flow-col sm:auto-cols-fr items-stretch gap-2" role="img" aria-label={`Process: ${labels.join(" then ")}`}>
      {labels.slice(0, 6).map((label, index) => (
        <div key={`${label}-${index}`} className="contents">
          <div className={`rounded-2xl border-2 p-4 text-center shadow-sm transition-all duration-300 ${activeIndex === index || (activeLabel !== null && activeLabel.toLowerCase() === label.toLowerCase()) ? "bg-cyan-100 border-cyan-500 scale-105 ring-2 ring-cyan-200" : activeIndex !== null ? "bg-white border-cyan-100 opacity-50" : "bg-white border-cyan-100"}`}>
            <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-cyan-500 text-white text-xs font-black">{index + 1}</span>
            <p className="mt-2 text-xs sm:text-sm font-black text-slate-800 leading-tight">{label}</p>
          </div>
          {index < Math.min(labels.length, 6) - 1 && <span className="self-center text-center text-violet-500 font-black rotate-90 sm:rotate-0">→</span>}
        </div>
      ))}
    </div>
  );
}

function BeforeAfterDiagram({ labels, activeIndex }: { labels: string[]; activeIndex: number | null }) {
  const midpoint = Math.max(1, Math.ceil(labels.length / 2));
  const sides = [
    { title: "Before", emoji: "⏮️", labels: labels.slice(0, midpoint), color: "from-sky-50 to-blue-100 border-blue-200" },
    { title: "After", emoji: "⏭️", labels: labels.slice(midpoint), color: "from-amber-50 to-orange-100 border-orange-200" },
  ];
  return (
    <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch" role="img" aria-label={`Before and after: ${labels.join(", ")}`}>
      {sides.map((side, index) => (
        <div key={side.title} className="contents">
          <div className={`rounded-2xl bg-gradient-to-br ${side.color} border-2 p-5`}>
            <p className="text-3xl">{side.emoji}</p>
            <p className="font-black text-slate-900 mt-2">{side.title}</p>
            <ul className="mt-2 space-y-1">
              {(side.labels.length ? side.labels : ["Observe the change"]).map((label) => <li key={label} className={`rounded px-1 text-sm transition-all ${activeIndex !== null && labels[activeIndex] === label ? "bg-amber-200 font-black text-slate-950" : activeIndex !== null ? "opacity-50" : "text-slate-700"}`}>• {label}</li>)}
            </ul>
          </div>
          {index === 0 && <span className="self-center text-center text-2xl text-violet-500 font-black rotate-90 sm:rotate-0">→</span>}
        </div>
      ))}
    </div>
  );
}

function ParticleScene({ labels, activeIndex = null }: { labels: string[]; activeIndex?: number | null }) {
  const legend = labels.slice(0, 4);
  const colors = ["bg-fuchsia-500", "bg-cyan-500", "bg-amber-400", "bg-emerald-500"];
  return (
    <div role="img" aria-label={`Particle scene showing ${legend.join(", ")}`}>
      <div className="relative h-52 rounded-3xl bg-slate-900 overflow-hidden border-4 border-white shadow-inner">
        {Array.from({ length: 32 }).map((_, index) => {
          const type = index % Math.max(1, legend.length);
          return (
            <span
              key={index}
              className={`absolute rounded-full ${colors[type]} border-2 transition-all duration-300 ${activeIndex === null ? "border-white/50" : activeIndex % Math.max(1, legend.length) === type ? "border-yellow-200 ring-4 ring-yellow-300 scale-150 z-10" : "border-white/20 opacity-35"}`}
              style={{
                width: `${12 + (type % 2) * 4}px`,
                height: `${12 + (type % 2) * 4}px`,
                left: `${5 + (index * 31) % 88}%`,
                top: `${8 + (index * 47) % 80}%`,
              }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {legend.map((label, index) => (
          <span key={`${label}-${index}`} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${activeIndex === index ? "bg-yellow-100 border-yellow-400 text-slate-950" : "bg-white border-slate-200 text-slate-700"}`}>
            <i className={`w-2.5 h-2.5 rounded-full ${colors[index]}`} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScaleDiagram({ labels, activeIndex }: { labels: string[]; activeIndex: number | null }) {
  return (
    <div role="img" aria-label={`Scale from ${labels.join(" to ")}`} className="py-5">
      <div className="h-5 rounded-full bg-gradient-to-r from-rose-500 via-amber-300 via-emerald-400 to-violet-600 shadow-inner" />
      <div className="grid mt-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, labels.length)}, minmax(0, 1fr))` }}>
        {labels.slice(0, 7).map((label, index) => (
          <div key={`${label}-${index}`} className={`text-center px-1 rounded transition-all ${activeIndex === index ? "bg-violet-100 scale-110" : activeIndex !== null ? "opacity-45" : ""}`}>
            <span className={`block w-1 h-3 mx-auto -mt-3 mb-2 ${activeIndex === index ? "bg-violet-700" : "bg-slate-400"}`} />
            <span className={`text-[10px] sm:text-xs font-bold leading-tight ${activeIndex === index ? "text-violet-950" : "text-slate-700"}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoordinateGrid({ labels, activeLabel }: { labels: string[]; activeLabel: string | null }) {
  const points = labels.flatMap((label) => {
    const match = label.match(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)/);
    return match ? [{ label, x: Number(match[1]), y: Number(match[2]) }] : [];
  });
  const toX = (value: number) => 160 + Math.max(-5, Math.min(5, value)) * 26;
  const toY = (value: number) => 150 - Math.max(-5, Math.min(5, value)) * 24;
  return (
    <svg viewBox="0 0 320 300" className="w-full max-w-xl mx-auto bg-white rounded-2xl" role="img" aria-label={`Coordinate grid with ${labels.join(", ")}`}>
      {Array.from({ length: 11 }).map((_, index) => <g key={index}><line x1={30 + index * 26} y1="30" x2={30 + index * 26} y2="270" stroke="#e2e8f0" /><line x1="30" y1={30 + index * 24} x2="290" y2={30 + index * 24} stroke="#e2e8f0" /></g>)}
      <line x1="30" y1="150" x2="294" y2="150" stroke="#475569" strokeWidth="2" /><line x1="160" y1="274" x2="160" y2="26" stroke="#475569" strokeWidth="2" />
      <text x="296" y="145" className="fill-slate-700 text-[11px]">x</text><text x="166" y="25" className="fill-slate-700 text-[11px]">y</text>
      {points.map((point, index) => { const active = activeLabel === point.label; return <g key={`${point.label}-${index}`} className="transition-all"><circle cx={toX(point.x)} cy={toY(point.y)} r={active ? 10 : 6} fill={active ? "#f59e0b" : "#7c3aed"} stroke={active ? "#fef3c7" : "none"} strokeWidth="4" /><text x={toX(point.x) + 8} y={toY(point.y) - 8} className="fill-violet-800 text-[10px] font-bold">{point.label}</text></g>; })}
    </svg>
  );
}

export default function ChemistryDiagram({ block }: { block: DiagramBlock }) {
  const labels = block.labels?.filter(Boolean).slice(0, 7) ?? [];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeLabel = activeIndex === null ? null : labels[activeIndex] ?? null;
  const gravityTopic = /gravity/i.test(`${block.title} ${block.caption} ${labels.join(" ")}`);
  useEffect(() => setActiveIndex(null), [block.title, block.diagram]);
  return (
    <figure className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎨</span>
        <h3 className="font-black text-violet-950">{block.title}</h3>
      </div>
      {block.diagram === "atom" && <AtomDiagram activeLabel={activeLabel} activeIndex={activeIndex} />}
      {block.diagram === "particle-states" && <ParticleStatesDiagram activeLabel={activeLabel} activeIndex={activeIndex} />}
      {block.diagram === "rusting" && <RustDiagram activeLabel={activeLabel} activeIndex={activeIndex} />}
      {block.diagram === "dissolving" && (
        labels.length >= 2 ? <ParticleScene labels={labels} activeIndex={activeIndex} /> : <DissolvingDiagram activeLabel={activeLabel} activeIndex={activeIndex} />
      )}
      {block.diagram === "reaction" && (
        labels.length >= 2 ? <ProcessDiagram labels={labels} activeIndex={activeIndex} activeLabel={activeLabel} /> : <ReactionDiagram activeIndex={activeIndex} />
      )}
      {block.diagram === "concept-map" && (gravityTopic
        ? <GravityDiagram />
        : <ConceptMap labels={labels.length >= 2 ? labels : [block.title, block.caption]} activeIndex={activeIndex} onSelect={setActiveIndex} />)}
      {block.diagram === "process" && <ProcessDiagram labels={labels.length >= 2 ? labels : [block.title, block.caption]} activeIndex={activeIndex} activeLabel={activeLabel} />}
      {block.diagram === "before-after" && <BeforeAfterDiagram labels={labels.length >= 2 ? labels : [block.title, block.caption]} activeIndex={activeIndex} />}
      {block.diagram === "particle-scene" && (/compound|molecule|element|chemical bond/i.test(`${block.title} ${labels.join(" ")}`)
        ? <CompoundFormationDiagram labels={labels.length >= 2 ? labels : ["Hydrogen atoms", "Oxygen atoms", "Water molecule", "Chemical bond"]} />
        : <ParticleScene labels={labels.length >= 2 ? labels : [block.title, "Surrounding particles"]} activeIndex={activeIndex} />)}
      {block.diagram === "scale" && <ScaleDiagram labels={labels.length >= 2 ? labels : ["Low", block.title, "High"]} activeIndex={activeIndex} />}
      {block.diagram === "coordinate-grid" && <CoordinateGrid labels={labels} activeLabel={activeLabel} />}
      {labels.length > 0 && !gravityTopic && !(/compound|molecule|element|chemical bond/i.test(`${block.title} ${labels.join(" ")}`) && block.diagram === "particle-scene") && (
        <div className="mt-4 rounded-2xl border border-violet-100 bg-white/80 p-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-violet-700">Choose a label to highlight it in the illustration</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {labels.map((label, index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${activeLabel === label ? "bg-violet-600 text-white shadow" : "bg-violet-100 text-violet-800 hover:bg-violet-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {activeLabel && (
            <p className="mt-3 rounded-xl bg-cyan-50 p-3 text-sm text-cyan-950" aria-live="polite">
              <strong>Now focus on “{activeLabel}”.</strong> Find where it appears in the model, then connect it to the caption: {block.caption}
            </p>
          )}
        </div>
      )}
      <figcaption className="mt-4 text-xs text-slate-500 text-center">
        {block.caption} <span className="font-bold">Model • not to scale</span>
      </figcaption>
    </figure>
  );
}
