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

export default function ChemistryDiagram({ block }: { block: DiagramBlock }) {
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
      <figcaption className="mt-4 text-xs text-slate-500 text-center">
        {block.caption} <span className="font-bold">Model • not to scale</span>
      </figcaption>
    </figure>
  );
}
