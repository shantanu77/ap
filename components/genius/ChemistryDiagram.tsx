import type { ExtractedGeniusBlock } from "@/components/genius/types";

type DiagramBlock = ExtractedGeniusBlock<"diagram">;

const particles = [
  [18, 20], [42, 20], [66, 20], [90, 20],
  [18, 45], [42, 45], [66, 45], [90, 45],
  [18, 70], [42, 70], [66, 70], [90, 70],
];

function AtomDiagram() {
  return (
    <svg viewBox="0 0 320 190" className="w-full h-auto" role="img" aria-label="Simplified atom model">
      <defs>
        <radialGradient id="nucleus" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="95" rx="112" ry="45" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="7 7" />
      <ellipse cx="160" cy="95" rx="55" ry="86" fill="none" stroke="#60a5fa" strokeWidth="3" strokeDasharray="7 7" transform="rotate(35 160 95)" />
      <ellipse cx="160" cy="95" rx="55" ry="86" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="7 7" transform="rotate(-35 160 95)" />
      <circle cx="160" cy="95" r="30" fill="url(#nucleus)" />
      <text x="160" y="91" textAnchor="middle" className="fill-amber-950 text-[12px] font-bold">NUCLEUS</text>
      <text x="160" y="106" textAnchor="middle" className="fill-amber-900 text-[10px]">p⁺ + n⁰</text>
      {[[49, 95], [271, 95], [118, 30], [204, 159]].map(([x, y], index) => (
        <g key={index}>
          <circle cx={x} cy={y} r="11" fill="#4f46e5" />
          <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[11px] font-bold">e⁻</text>
        </g>
      ))}
    </svg>
  );
}

function ParticleStatesDiagram() {
  return (
    <div className="grid grid-cols-3 gap-2" role="img" aria-label="Particle arrangements in solid, liquid, and gas">
      {[
        { name: "Solid 🧊", type: "solid", color: "bg-sky-500" },
        { name: "Liquid 💧", type: "liquid", color: "bg-indigo-500" },
        { name: "Gas 💨", type: "gas", color: "bg-fuchsia-500" },
      ].map((state) => (
        <div key={state.type} className="rounded-xl bg-white/80 border border-violet-100 p-2">
          <div className="relative h-28 rounded-lg bg-slate-50 overflow-hidden">
            {particles.slice(0, state.type === "gas" ? 7 : 12).map(([x, y], index) => {
              const left = state.type === "solid" ? x - 7 : state.type === "liquid" ? x - 7 + (index % 3) * 4 : (index * 37) % 88;
              const top = state.type === "solid" ? y : state.type === "liquid" ? Math.min(83, y + (index % 2) * 10) : (index * 29) % 83;
              return <span key={index} className={`absolute w-3 h-3 rounded-full ${state.color}`} style={{ left: `${left}%`, top: `${top}%` }} />;
            })}
          </div>
          <p className="text-center text-xs font-bold text-slate-700 mt-2">{state.name}</p>
        </div>
      ))}
    </div>
  );
}

function RustDiagram() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4" role="img" aria-label="Iron plus oxygen plus water creates the conditions for rusting">
      {[
        ["🔩", "Iron", "bg-slate-100"],
        ["💨", "Oxygen", "bg-sky-100"],
        ["💧", "Water", "bg-blue-100"],
      ].map(([emoji, label, color], index) => (
        <div key={label} className="contents">
          <div className={`${color} rounded-2xl p-4 min-w-24 text-center border border-white shadow-sm`}>
            <div className="text-3xl">{emoji}</div>
            <p className="text-xs font-bold mt-1 text-slate-700">{label}</p>
          </div>
          {index < 2 && <span className="font-black text-violet-400">+</span>}
        </div>
      ))}
      <span className="font-black text-violet-400">→</span>
      <div className="bg-orange-100 rounded-2xl p-4 min-w-24 text-center border border-orange-200 shadow-sm">
        <div className="text-3xl">🟠</div>
        <p className="text-xs font-bold mt-1 text-orange-800">Rusting</p>
      </div>
    </div>
  );
}

function DissolvingDiagram() {
  return (
    <div className="grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="relative h-36 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-200 border-4 border-white shadow-inner overflow-hidden">
        <span className="absolute left-1/2 -translate-x-1/2 bottom-3 grid grid-cols-5 gap-0.5">
          {Array.from({ length: 20 }).map((_, index) => <i key={index} className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-400" />)}
        </span>
        <p className="absolute top-2 left-3 text-xs font-bold text-blue-700">Salt crystal</p>
      </div>
      <span className="text-2xl text-violet-500 text-center">→</span>
      <div className="relative h-36 rounded-2xl bg-gradient-to-b from-sky-50 to-blue-200 border-4 border-white shadow-inner overflow-hidden">
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

function ReactionDiagram() {
  return (
    <div className="grid sm:grid-cols-3 gap-3 text-center">
      {[
        ["👀", "Observe", "Notice the evidence"],
        ["⚛️", "Model", "Picture the particles"],
        ["🔮", "Predict", "Test another case"],
      ].map(([emoji, label, description], index) => (
        <div key={label} className="relative rounded-2xl bg-white p-4 border border-violet-100">
          <p className="text-3xl">{emoji}</p>
          <p className="font-black text-violet-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
          {index < 2 && <span className="hidden sm:block absolute -right-5 top-1/2 text-violet-400 text-xl z-10">→</span>}
        </div>
      ))}
    </div>
  );
}

function ConceptMap({ labels }: { labels: string[] }) {
  const [center = "Chemistry idea", ...branches] = labels;
  const visibleBranches = branches.slice(0, 5);
  return (
    <div className="relative min-h-72 grid place-items-center py-3" role="img" aria-label={`Concept map: ${labels.join(", ")}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden>
        {visibleBranches.map((_, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(1, visibleBranches.length) - Math.PI / 2;
          const x = 300 + Math.cos(angle) * 215;
          const y = 150 + Math.sin(angle) * 105;
          return <line key={index} x1="300" y1="150" x2={x} y2={y} stroke="#a78bfa" strokeWidth="3" strokeDasharray="7 6" />;
        })}
      </svg>
      <div className="relative z-10 rounded-3xl bg-violet-700 text-white p-5 max-w-52 text-center shadow-xl border-4 border-white">
        <span className="text-2xl">⚗️</span>
        <p className="font-black leading-tight mt-1">{center}</p>
      </div>
      {visibleBranches.map((label, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(1, visibleBranches.length) - Math.PI / 2;
        const left = 50 + Math.cos(angle) * 38;
        const top = 50 + Math.sin(angle) * 37;
        return (
          <div
            key={`${label}-${index}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white border-2 border-violet-200 px-3 py-2 text-center text-xs sm:text-sm font-bold text-violet-950 shadow-sm max-w-40"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {["👀", "⚛️", "🔍", "🌍", "💡"][index]} {label}
          </div>
        );
      })}
    </div>
  );
}

function ProcessDiagram({ labels }: { labels: string[] }) {
  return (
    <div className="grid sm:grid-flow-col sm:auto-cols-fr items-stretch gap-2" role="img" aria-label={`Process: ${labels.join(" then ")}`}>
      {labels.slice(0, 6).map((label, index) => (
        <div key={`${label}-${index}`} className="contents">
          <div className="rounded-2xl bg-white border-2 border-cyan-100 p-4 text-center shadow-sm">
            <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-cyan-500 text-white text-xs font-black">{index + 1}</span>
            <p className="mt-2 text-xs sm:text-sm font-black text-slate-800 leading-tight">{label}</p>
          </div>
          {index < Math.min(labels.length, 6) - 1 && <span className="self-center text-center text-violet-500 font-black rotate-90 sm:rotate-0">→</span>}
        </div>
      ))}
    </div>
  );
}

function BeforeAfterDiagram({ labels }: { labels: string[] }) {
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
              {(side.labels.length ? side.labels : ["Observe the change"]).map((label) => <li key={label} className="text-sm text-slate-700">• {label}</li>)}
            </ul>
          </div>
          {index === 0 && <span className="self-center text-center text-2xl text-violet-500 font-black rotate-90 sm:rotate-0">→</span>}
        </div>
      ))}
    </div>
  );
}

function ParticleScene({ labels }: { labels: string[] }) {
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
              className={`absolute rounded-full ${colors[type]} border-2 border-white/50`}
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
          <span key={`${label}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            <i className={`w-2.5 h-2.5 rounded-full ${colors[index]}`} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScaleDiagram({ labels }: { labels: string[] }) {
  return (
    <div role="img" aria-label={`Scale from ${labels.join(" to ")}`} className="py-5">
      <div className="h-5 rounded-full bg-gradient-to-r from-rose-500 via-amber-300 via-emerald-400 to-violet-600 shadow-inner" />
      <div className="grid mt-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, labels.length)}, minmax(0, 1fr))` }}>
        {labels.slice(0, 7).map((label, index) => (
          <div key={`${label}-${index}`} className="text-center px-1">
            <span className="block w-0.5 h-3 bg-slate-400 mx-auto -mt-3 mb-2" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChemistryDiagram({ block }: { block: DiagramBlock }) {
  const labels = block.labels?.filter(Boolean).slice(0, 7) ?? [];
  return (
    <figure className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🎨</span>
        <h3 className="font-black text-violet-950">{block.title}</h3>
      </div>
      {block.diagram === "atom" && <AtomDiagram />}
      {block.diagram === "particle-states" && <ParticleStatesDiagram />}
      {block.diagram === "rusting" && <RustDiagram />}
      {block.diagram === "dissolving" && <DissolvingDiagram />}
      {block.diagram === "reaction" && <ReactionDiagram />}
      {block.diagram === "concept-map" && <ConceptMap labels={labels.length >= 2 ? labels : [block.title, block.caption]} />}
      {block.diagram === "process" && <ProcessDiagram labels={labels.length >= 2 ? labels : [block.title, block.caption]} />}
      {block.diagram === "before-after" && <BeforeAfterDiagram labels={labels.length >= 2 ? labels : [block.title, block.caption]} />}
      {block.diagram === "particle-scene" && <ParticleScene labels={labels.length >= 2 ? labels : [block.title, "Surrounding particles"]} />}
      {block.diagram === "scale" && <ScaleDiagram labels={labels.length >= 2 ? labels : ["Low", block.title, "High"]} />}
      <figcaption className="mt-4 text-xs text-slate-500 text-center">
        {block.caption} <span className="font-bold">Model • not to scale</span>
      </figcaption>
    </figure>
  );
}
