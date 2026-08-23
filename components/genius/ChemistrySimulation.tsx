"use client";

import { useMemo, useState } from "react";
import type { ExtractedGeniusBlock } from "@/components/genius/types";

type SimulationBlock = ExtractedGeniusBlock<"simulation">;

function LabShell({ children, modelNote }: { children: React.ReactNode; modelNote: string }) {
  return (
    <div className="rounded-3xl bg-slate-950 text-white p-4 sm:p-6 shadow-xl overflow-hidden">
      {children}
      <p className="mt-5 text-[11px] leading-relaxed text-slate-400 border-t border-slate-700 pt-3">
        🔎 <strong>Model note:</strong> {modelNote}
      </p>
    </div>
  );
}

function RustSimulation() {
  const [water, setWater] = useState<"dry" | "damp" | "wet">("damp");
  const [salt, setSalt] = useState(false);
  const [coating, setCoating] = useState<"none" | "paint" | "zinc">("none");
  const [time, setTime] = useState(0);
  const rate = coating === "paint" ? 0.05 : coating === "zinc" ? 0.12 : water === "dry" ? 0.03 : water === "wet" ? 0.75 : 0.45;
  const rust = Math.min(100, Math.round(time * rate * (salt ? 1.65 : 1)));

  return (
    <LabShell modelNote="Time is accelerated. Real corrosion depends on the metal and many environmental details.">
      <div className="grid md:grid-cols-[1fr_1.15fr] gap-5">
        <div className="space-y-4">
          <label className="block text-sm font-bold">Water condition
            <select value={water} onChange={(event) => setWater(event.target.value as typeof water)} className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5">
              <option value="dry">Dry air 🏜️</option><option value="damp">Damp air 🌧️</option><option value="wet">Submerged 💧</option>
            </select>
          </label>
          <label className="block text-sm font-bold">Protection
            <select value={coating} onChange={(event) => setCoating(event.target.value as typeof coating)} className="mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5">
              <option value="none">None</option><option value="paint">Paint 🎨</option><option value="zinc">Zinc coating 🛡️</option>
            </select>
          </label>
          <label className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
            <input type="checkbox" checked={salt} onChange={(event) => setSalt(event.target.checked)} className="w-5 h-5 accent-cyan-400" />
            <span className="text-sm font-bold">Add salt 🌊</span>
          </label>
        </div>
        <div className="rounded-2xl bg-sky-950 p-4 flex flex-col justify-between">
          <div className="relative h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-sky-800 to-slate-800">
            {water !== "dry" && <div className={`absolute bottom-0 left-0 right-0 bg-blue-500/35 transition-all ${water === "wet" ? "h-24" : "h-8"}`} />}
            <div className="relative w-48 h-10 rounded-lg bg-slate-400 border-4 border-slate-300 overflow-hidden">
              <div className="absolute inset-0 bg-orange-700 transition-all duration-500" style={{ opacity: rust / 115, clipPath: `polygon(0 0, ${rust}% 0, ${Math.min(100, rust + 18)}% 100%, 0 100%)` }} />
            </div>
            <span className="absolute right-2 top-2 text-xs bg-black/30 rounded-lg px-2 py-1">{rust}% model rust</span>
          </div>
          <label className="mt-4 text-xs font-bold">Time: {time} days (model)
            <input aria-label="Time in the rust model" type="range" min="0" max="120" value={time} onChange={(event) => setTime(Number(event.target.value))} className="w-full accent-orange-500 mt-2" />
          </label>
        </div>
      </div>
      <p className="mt-4 text-sm text-cyan-100">
        {rust < 10 ? "The iron is mostly protected—or missing enough water for fast rusting. 🛡️" : salt ? "Salt helps charge move through the water, so corrosion speeds up. ⚡" : "Water and oxygen can reach the iron, so rust builds over time. 🟠"}
      </p>
    </LabShell>
  );
}

function ParticleStatesSimulation() {
  const [temperature, setTemperature] = useState(30);
  const state = temperature < 25 ? "Solid 🧊" : temperature < 70 ? "Liquid 💧" : "Gas 💨";
  const spread = temperature < 25 ? 22 : temperature < 70 ? 35 : 88;
  return (
    <LabShell modelNote="This two-dimensional particle picture is enlarged and simplified. Temperature values are a learning scale, not water’s exact temperatures.">
      <div className="relative h-56 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 border border-slate-700 overflow-hidden">
        {Array.from({ length: 24 }).map((_, index) => {
          const solidX = 18 + (index % 6) * 12;
          const solidY = 58 + Math.floor(index / 6) * 11;
          const hotX = 5 + ((index * 37) % 90);
          const hotY = 8 + ((index * 53) % 84);
          const ratio = spread / 100;
          return <span key={index} className="absolute w-3.5 h-3.5 rounded-full bg-cyan-300 border-2 border-cyan-100 transition-all duration-500" style={{ left: `${solidX * (1 - ratio) + hotX * ratio}%`, top: `${solidY * (1 - ratio) + hotY * ratio}%` }} />;
        })}
        <div className="absolute top-3 left-3 bg-black/35 rounded-xl px-3 py-2 font-black">{state}</div>
      </div>
      <label className="block mt-5 font-bold text-sm">Energy / temperature: {temperature}
        <input aria-label="Particle energy" type="range" min="0" max="100" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} className="block w-full mt-2 accent-cyan-400" />
      </label>
    </LabShell>
  );
}

function AtomBuilderSimulation() {
  const [protons, setProtons] = useState(6);
  const [neutrons, setNeutrons] = useState(6);
  const [electrons, setElectrons] = useState(6);
  const elements = ["Neutronium?", "Hydrogen", "Helium", "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon"];
  const element = elements[protons] ?? `Element ${protons}`;
  const charge = protons - electrons;
  const adjust = (label: string, value: number, setValue: (value: number) => void, color: string) => (
    <div className="rounded-xl bg-slate-800 p-3 flex items-center justify-between">
      <span className={`text-sm font-bold ${color}`}>{label}: {value}</span>
      <div className="flex gap-2">
        <button onClick={() => setValue(Math.max(0, value - 1))} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-black" aria-label={`Remove ${label}`}>−</button>
        <button onClick={() => setValue(Math.min(10, value + 1))} className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 font-black" aria-label={`Add ${label}`}>+</button>
      </div>
    </div>
  );
  return (
    <LabShell modelNote="Electron shells are a simplified Grade 6–8 model, and the picture is not to scale.">
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-3">
          {adjust("Protons ➕", protons, setProtons, "text-rose-300")}
          {adjust("Neutrons ⚪", neutrons, setNeutrons, "text-slate-200")}
          {adjust("Electrons ➖", electrons, setElectrons, "text-cyan-300")}
        </div>
        <div className="rounded-2xl bg-indigo-950 p-5 text-center">
          <p className="text-5xl mb-2">⚛️</p>
          <p className="text-2xl font-black">{protons === 0 ? "No element yet" : element}</p>
          <p className="text-sm text-indigo-200 mt-2">Atomic number {protons} • Mass {protons + neutrons}</p>
          <p className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold ${charge === 0 ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>
            {charge === 0 ? "Neutral atom" : `Charge ${charge > 0 ? "+" : ""}${charge}`}
          </p>
        </div>
      </div>
    </LabShell>
  );
}

function DissolvingSimulation() {
  const [temperature, setTemperature] = useState(30);
  const [stirring, setStirring] = useState(false);
  const [amount, setAmount] = useState(50);
  const dissolved = Math.min(100, 20 + temperature * 0.45 + (stirring ? 28 : 0));
  return (
    <LabShell modelNote="This model compares dissolving rate. Stirring does not necessarily increase the final solubility at a fixed temperature.">
      <div className="grid sm:grid-cols-[1fr_1.2fr] gap-5">
        <div className="space-y-4 text-sm">
          <label className="block font-bold">Water temperature: {temperature}
            <input type="range" min="10" max="80" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} className="w-full accent-rose-400 mt-2" />
          </label>
          <label className="block font-bold">Salt amount: {amount}
            <input type="range" min="10" max="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="w-full accent-amber-300 mt-2" />
          </label>
          <button onClick={() => setStirring((value) => !value)} className={`w-full rounded-xl p-3 font-black ${stirring ? "bg-cyan-400 text-slate-950" : "bg-slate-700"}`}>
            {stirring ? "Stirring! 🥄" : "Start stirring"}
          </button>
        </div>
        <div className="relative h-48 rounded-b-[3rem] border-x-4 border-b-4 border-cyan-100/70 bg-blue-500/30 overflow-hidden">
          {Array.from({ length: Math.round(amount / 4) }).map((_, index) => {
            const isFloating = index / Math.max(1, amount / 4) < dissolved / 100;
            return <span key={index} className={`absolute w-2.5 h-2.5 rounded-full ${index % 2 ? "bg-indigo-300" : "bg-amber-300"} transition-all duration-700`} style={{ left: `${8 + (index * 31) % 84}%`, top: isFloating ? `${10 + (index * 47) % 70}%` : `${82 + (index % 3) * 3}%` }} />;
          })}
          <span className="absolute top-2 right-2 text-xs bg-black/30 px-2 py-1 rounded-lg">{Math.round(dissolved)}% spread</span>
        </div>
      </div>
    </LabShell>
  );
}

function PhSimulation() {
  const substances = useMemo(() => [
    { name: "Lemon juice 🍋", ph: 2, color: "#ef4444" },
    { name: "Water 💧", ph: 7, color: "#22c55e" },
    { name: "Baking soda solution 🥄", ph: 9, color: "#3b82f6" },
    { name: "Soapy water 🧼", ph: 11, color: "#7c3aed" },
  ], []);
  const [index, setIndex] = useState(1);
  const selected = substances[index];
  return (
    <LabShell modelNote="These pH values are typical approximations and can vary. This is a virtual indicator—never taste lab samples.">
      <label className="text-sm font-bold">Choose a familiar substance
        <select value={index} onChange={(event) => setIndex(Number(event.target.value))} className="mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl p-3">
          {substances.map((substance, itemIndex) => <option key={substance.name} value={itemIndex}>{substance.name}</option>)}
        </select>
      </label>
      <div className="mt-5 rounded-2xl bg-white p-4 text-slate-900">
        <div className="h-7 rounded-full bg-gradient-to-r from-red-500 via-yellow-300 via-green-500 to-violet-700 relative">
          <span className="absolute -top-2 w-3 h-11 bg-slate-950 rounded-full transition-all" style={{ left: `calc(${(selected.ph / 14) * 100}% - 6px)` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold mt-2"><span>0 Acidic</span><span>7 Neutral</span><span>14 Basic</span></div>
        <p className="text-center mt-4 text-xl font-black" style={{ color: selected.color }}>pH ≈ {selected.ph}</p>
      </div>
    </LabShell>
  );
}

function MassBalanceSimulation() {
  const [closed, setClosed] = useState(true);
  const mass = closed ? 100 : 82;
  return (
    <LabShell modelNote="Atoms remain conserved. An open container can appear to lose mass when a gas leaves the measured system.">
      <div className="grid sm:grid-cols-2 gap-5 items-center">
        <button onClick={() => setClosed((value) => !value)} className="rounded-2xl bg-slate-800 p-5 hover:bg-slate-700">
          <p className="text-5xl">{closed ? "🫙" : "🥣"}</p>
          <p className="font-black mt-2">{closed ? "Closed container" : "Open container"}</p>
          <p className="text-xs text-slate-400 mt-1">Tap to change</p>
        </button>
        <div className="rounded-2xl bg-emerald-950 p-5 text-center">
          <p className="text-xs text-emerald-200 uppercase tracking-widest">Scale reading</p>
          <p className="text-5xl font-black mt-2">{mass} g</p>
          {!closed && <p className="text-xs text-amber-200 mt-2">💨 18 g of gas left the scale</p>}
        </div>
      </div>
    </LabShell>
  );
}

function ForceMotionSimulation() {
  const [force, setForce] = useState(30);
  const [mass, setMass] = useState(5);
  const acceleration = force / mass;
  return (
    <LabShell modelNote="This model uses acceleration = force ÷ mass and leaves out friction and air resistance.">
      <div className="grid sm:grid-cols-2 gap-5 items-center">
        <div className="space-y-4 text-sm font-bold">
          <label>Push force: {force} N<input type="range" min="0" max="100" value={force} onChange={(event) => setForce(Number(event.target.value))} className="block w-full mt-2 accent-cyan-400" /></label>
          <label>Cart mass: {mass} kg<input type="range" min="1" max="20" value={mass} onChange={(event) => setMass(Number(event.target.value))} className="block w-full mt-2 accent-amber-400" /></label>
        </div>
        <div className="rounded-2xl bg-indigo-950 p-5 overflow-hidden">
          <div className="h-24 border-b-4 border-slate-500 relative"><span className="absolute bottom-1 text-5xl transition-all duration-500" style={{ left: `${Math.min(78, acceleration * 5)}%` }}>🛒</span></div>
          <p className="text-center mt-4 text-xl font-black">Acceleration: {acceleration.toFixed(1)} m/s²</p>
        </div>
      </div>
    </LabShell>
  );
}

function BatteryCircuitSimulation() {
  const [closed, setClosed] = useState(false);
  const [cells, setCells] = useState<1 | 2>(1);
  const voltage = cells * 1.5;
  const brightness = closed ? (cells === 2 ? 100 : 55) : 0;
  return (
    <LabShell modelNote="This is a simplified low-voltage circuit model. Real bulb brightness also depends on resistance and the battery's condition. Never connect wires to a wall socket.">
      <div className="grid sm:grid-cols-[0.9fr_1.2fr] gap-5 items-center">
        <div className="space-y-3">
          <label className="block text-sm font-bold">Cells in series
            <select value={cells} onChange={(event) => setCells(Number(event.target.value) as 1 | 2)} className="mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl p-3">
              <option value={1}>1 cell — 1.5 V</option>
              <option value={2}>2 cells — 3.0 V</option>
            </select>
          </label>
          <button type="button" onClick={() => setClosed((value) => !value)} className={`w-full rounded-xl p-3 font-black ${closed ? "bg-emerald-400 text-slate-950" : "bg-slate-700"}`}>
            {closed ? "Open switch ⏻" : "Close switch ⭘"}
          </button>
          <p className="text-xs text-slate-300">Battery voltage: {voltage.toFixed(1)} V • Current path: {closed ? "complete" : "broken"}</p>
        </div>
        <div className="relative h-52 rounded-2xl bg-indigo-950 border border-slate-700">
          <div className={`absolute left-10 right-10 top-10 bottom-10 rounded-3xl border-4 ${closed ? "border-cyan-300" : "border-slate-500"}`} />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-4 text-2xl" aria-label={`${cells} battery cells`}>{cells === 1 ? "🔋" : "🔋🔋"}</div>
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-center">
            <span className="block text-5xl transition-all" style={{ filter: `drop-shadow(0 0 ${brightness / 5}px rgb(250 204 21))`, opacity: closed ? 1 : 0.35 }}>💡</span>
            <span className="text-[10px] text-slate-300">{brightness}% model brightness</span>
          </div>
          {!closed && <span className="absolute left-1/2 top-8 -translate-x-1/2 bg-indigo-950 px-2 text-amber-300 font-black">open gap</span>}
          {closed && <span className="absolute left-1/2 bottom-3 -translate-x-1/2 text-xs text-cyan-200 animate-pulse">charge flows around the loop →</span>}
        </div>
      </div>
    </LabShell>
  );
}

function CellExplorerSimulation() {
  const organelles = [
    { name: "Nucleus", emoji: "🟣", job: "Stores DNA and coordinates many cell activities." },
    { name: "Cell membrane", emoji: "🫧", job: "Controls what enters and leaves the cell." },
    { name: "Mitochondria", emoji: "⚡", job: "Release usable energy from food molecules." },
    { name: "Ribosomes", emoji: "🔹", job: "Build proteins from amino acids." },
  ];
  const [selected, setSelected] = useState(0);
  return (
    <LabShell modelNote="A cell contains many more structures, and this enlarged illustration is not to scale.">
      <div className="grid sm:grid-cols-[1fr_1.2fr] gap-4">
        <div className="grid gap-2">{organelles.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`rounded-xl p-3 text-left font-bold ${selected === index ? "bg-cyan-400 text-slate-950" : "bg-slate-800"}`}>{item.emoji} {item.name}</button>)}</div>
        <div className="rounded-[45%] border-8 border-emerald-400 bg-emerald-950 min-h-56 grid place-items-center p-8 text-center"><div><p className="text-6xl">{organelles[selected].emoji}</p><p className="text-xl font-black mt-3">{organelles[selected].name}</p><p className="text-sm text-emerald-100 mt-2">{organelles[selected].job}</p></div></div>
      </div>
    </LabShell>
  );
}

function FoodChainSimulation() {
  const [producerEnergy, setProducerEnergy] = useState(1000);
  const herbivore = Math.round(producerEnergy * 0.1);
  const predator = Math.round(herbivore * 0.1);
  return (
    <LabShell modelNote="The 10% transfer is a useful approximation; real ecosystems vary and have complex food webs.">
      <label className="text-sm font-bold">Energy captured by plants: {producerEnergy} units<input type="range" min="100" max="2000" step="100" value={producerEnergy} onChange={(event) => setProducerEnergy(Number(event.target.value))} className="block w-full mt-2 accent-green-400" /></label>
      <div className="grid grid-cols-3 gap-2 mt-5 text-center items-end">
        {[{ e: "🌿", n: "Plants", v: producerEnergy }, { e: "🐇", n: "Herbivore", v: herbivore }, { e: "🦅", n: "Predator", v: predator }].map((item) => <div key={item.n} className="rounded-xl bg-slate-800 p-3"><p className="text-4xl">{item.e}</p><p className="font-black">{item.n}</p><p className="text-cyan-300 text-sm">{item.v} units</p></div>)}
      </div>
    </LabShell>
  );
}

export default function ChemistrySimulation({ block }: { block: SimulationBlock }) {
  return (
    <section aria-label={block.title} className="space-y-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Interactive lab 🧪</p>
        <h3 className="text-xl font-black text-slate-900">{block.title}</h3>
        <p className="text-sm text-slate-600 mt-1">🤔 {block.prompt}</p>
      </div>
      {block.simulation === "rust-conditions.v1" && <RustSimulation />}
      {block.simulation === "particle-states.v1" && <ParticleStatesSimulation />}
      {block.simulation === "atom-builder.v1" && <AtomBuilderSimulation />}
      {block.simulation === "dissolving.v1" && <DissolvingSimulation />}
      {block.simulation === "ph-indicator.v1" && <PhSimulation />}
      {block.simulation === "mass-balance.v1" && <MassBalanceSimulation />}
      {block.simulation === "force-motion.v1" && <ForceMotionSimulation />}
      {block.simulation === "battery-circuit.v1" && <BatteryCircuitSimulation />}
      {block.simulation === "cell-explorer.v1" && <CellExplorerSimulation />}
      {block.simulation === "food-chain.v1" && <FoodChainSimulation />}
    </section>
  );
}
