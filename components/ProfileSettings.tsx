"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KID_AVATARS } from "@/lib/kidProfile";

type Profile = { email: string; name: string; grade: number; emoji: string };
type BoardSettings = { activeDays: number[]; remindersEnabled: boolean; reminderEmail: string | null; reminderTime: string };
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProfileSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(6);
  const [emoji, setEmoji] = useState<string>(KID_AVATARS[0]);
  const [board, setBoard] = useState<BoardSettings>({ activeDays: [0, 2, 4], remindersEnabled: false, reminderEmail: "", reminderTime: "18:00" });
  const [message, setMessage] = useState("");
  const [boardMessage, setBoardMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (response.status === 401) { router.replace("/login"); return null; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your profile.");
      return data.profile as Profile;
    }).then((data) => {
      if (!data) return;
      setProfile(data); setName(data.name); setGrade(data.grade); setEmoji(data.emoji);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load your profile."));
    fetch("/api/board/settings").then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setBoard(data); }).catch(() => undefined);
  }, [router]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, grade, emoji }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your profile.");
      setProfile(data.profile); setMessage("Profile saved! ✅");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your profile."); }
    finally { setBusy(false); }
  };

  const saveBoard = async () => {
    setBusy(true); setError(""); setBoardMessage("");
    try {
      const response = await fetch("/api/board/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(board) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save study reminders.");
      setBoard(data); setBoardMessage("Study schedule saved! ✅");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save study reminders."); }
    finally { setBusy(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login"); router.refresh();
  };

  if (!profile) return <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 text-center text-slate-500 shadow-sm">Loading your profile…</div>;

  return <section className="mx-auto max-w-xl rounded-3xl border border-violet-100 bg-white p-5 shadow-lg sm:p-8">
    <p className="text-xs font-black uppercase tracking-widest text-violet-600">Your learning space</p>
    <h1 className="mt-2 text-3xl font-black text-slate-950">Account settings 👤</h1>
    <form className="mt-6 space-y-5" onSubmit={(event) => void save(event)}>
      <label className="block text-sm font-bold text-slate-700">Sign-in email
        <input type="email" value={profile.email} readOnly aria-readonly="true" className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600" />
        <span className="mt-1 block text-xs font-normal text-slate-500">This verified email is fixed and cannot be edited here.</span>
      </label>
      <label className="block text-sm font-bold text-slate-700">Learner name
        <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900" />
      </label>
      <div><p className="text-sm font-bold text-slate-700">Study grade</p><div className="mt-2 flex gap-2">{[6, 7, 8].map((item) => <button key={item} type="button" onClick={() => setGrade(item)} aria-pressed={grade === item} className={`min-h-11 rounded-xl px-4 font-black ${grade === item ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"}`}>Grade {item}</button>)}</div></div>
      <div><p className="text-sm font-bold text-slate-700">Avatar</p><div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-8">{KID_AVATARS.map((item) => <button key={item} type="button" aria-label={`Choose ${item}`} aria-pressed={emoji === item} onClick={() => setEmoji(item)} className={`grid aspect-square min-h-10 place-items-center rounded-xl text-2xl ${emoji === item ? "bg-violet-100 ring-2 ring-violet-500" : "bg-slate-50"}`}>{item}</button>)}</div></div>
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <button disabled={busy} className="min-h-12 w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white disabled:bg-slate-300">{busy ? "Saving…" : "Save profile"}</button>
    </form>
    <section className="mt-7 border-t border-slate-100 pt-6">
      <p className="text-xs font-black uppercase tracking-widest text-violet-600">Study schedule</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Choose your study days 📅</h2>
      <div className="mt-4 flex flex-wrap gap-2">{DAYS.map((day, index) => <label key={day} className={`cursor-pointer rounded-full px-3 py-2 text-sm font-bold ${board.activeDays.includes(index) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}><input type="checkbox" checked={board.activeDays.includes(index)} onChange={(event) => setBoard((current) => ({ ...current, activeDays: event.target.checked ? [...current.activeDays, index].sort() : current.activeDays.filter((item) => item !== index) }))} className="sr-only" />{day}</label>)}</div>
      <label className="mt-5 flex min-h-11 items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={board.remindersEnabled} onChange={(event) => setBoard((current) => ({ ...current, remindersEnabled: event.target.checked }))} className="h-5 w-5 accent-violet-600" />Email me a study reminder</label>
      {board.remindersEnabled && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">Reminder email<input value={board.reminderEmail ?? profile.email} readOnly aria-readonly="true" className="mt-1 w-full cursor-not-allowed rounded-xl border bg-slate-100 px-3 py-2 font-normal text-slate-600" /></label><label className="text-sm font-bold text-slate-700">Reminder time<input type="time" value={board.reminderTime} onChange={(event) => setBoard((current) => ({ ...current, reminderTime: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2" /></label></div>}
      {boardMessage && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{boardMessage}</p>}
      <button type="button" disabled={busy || board.activeDays.length === 0} onClick={() => void saveBoard()} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 font-bold text-white disabled:bg-slate-300">{busy ? "Saving…" : "Save study schedule"}</button>
    </section>
    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
      <button type="button" onClick={() => router.push("/dashboard")} className="min-h-11 rounded-xl bg-indigo-50 px-4 font-bold text-indigo-800">📊 View progress</button>
      <button type="button" onClick={() => void logout()} className="min-h-11 rounded-xl bg-slate-100 px-4 font-bold text-slate-700">Log out</button>
    </div>
  </section>;
}
