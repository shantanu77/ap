"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KID_AVATARS } from "@/lib/kidProfile";
import { todayString } from "@/lib/utils";
import type { StudyLevel } from "@/types/genius";

type Mode = "signin" | "register";
type Stage = "details" | "code";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [stage, setStage] = useState<Stage>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState<StudyLevel>(6);
  const [emoji, setEmoji] = useState<string>(KID_AVATARS[0]);
  const [guardianAttested, setGuardianAttested] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const requestCode = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mode,
          ...(mode === "register" ? { name, grade, emoji, guardianAttested } : {}),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send a sign-in code.");
      setStage("code");
      setNotice(data.message || "Check your inbox for a sign-in code.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not send a sign-in code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (response.status === 404) {
        setMode("register");
        setStage("details");
        setCode("");
        setNotice("No learner profile is linked to this email yet. Add a few details to create one.");
        return;
      }
      if (!response.ok) throw new Error(data.error || "That code did not work.");
      localStorage.setItem("genius-study-level", String(data.profile.grade));
      const next = searchParams.get("next") || `/session/${todayString()}`;
      router.replace(next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : `/session/${todayString()}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-xl items-center justify-center py-8">
      <section className="w-full rounded-[2rem] border border-violet-100 bg-white p-6 shadow-xl sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">AllShare Learning Companion</p>
        {stage === "details" ? (
          <>
            <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Account options">
              <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => switchMode("signin")} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${mode === "signin" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => switchMode("register")} className={`rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${mode === "register" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Create a profile</button>
            </div>

            {mode === "signin" ? (
              <>
                <h1 className="mt-6 text-3xl font-black text-slate-950">Welcome back 👋</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Enter the email linked to your learner profile. We’ll send you a one-time sign-in code.</p>
                <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void requestCode(); }}>
                  <label className="block text-sm font-bold text-slate-700">Email address
                    <input autoComplete="email" type="email" required maxLength={191} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none focus:ring-2 focus:ring-violet-500" placeholder="you@example.com" />
                  </label>
                  {notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</p>}
                  {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">{error}</p>}
                  <button disabled={busy} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700 disabled:bg-slate-300">{busy ? "Sending your code…" : "Email me a sign-in code ✉️"}</button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-500">New here? <button type="button" onClick={() => switchMode("register")} className="font-bold text-violet-700 hover:underline">Create a learner profile</button></p>
              </>
            ) : (
              <>
                <h1 className="mt-6 text-3xl font-black text-slate-950">Let’s set up your learning profile 🌟</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">A parent or guardian can use an email they can open. We’ll send a code to verify it.</p>
                <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); void requestCode(); }}>
                  <label className="block text-sm font-bold text-slate-700">Learner name
                    <input autoComplete="name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none focus:ring-2 focus:ring-violet-500" placeholder="What should we call you?" />
                  </label>
                  <label className="block text-sm font-bold text-slate-700">Parent/guardian email
                    <input autoComplete="email" type="email" required maxLength={191} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-950 outline-none focus:ring-2 focus:ring-violet-500" placeholder="you@example.com" />
                  </label>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Pick a study grade</p>
                    <div className="mt-2 flex gap-2">{([6, 7, 8] as StudyLevel[]).map((item) => <button key={item} type="button" onClick={() => setGrade(item)} aria-pressed={grade === item} className={`h-11 w-14 rounded-xl font-black ${grade === item ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>Grade {item}</button>)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Choose a friendly avatar</p>
                    <div className="mt-2 grid grid-cols-8 gap-2">{KID_AVATARS.map((avatar) => <button key={avatar} type="button" onClick={() => setEmoji(avatar)} aria-label={`Choose ${avatar}`} aria-pressed={emoji === avatar} className={`grid aspect-square place-items-center rounded-xl text-2xl ${emoji === avatar ? "bg-violet-100 ring-2 ring-violet-500" : "bg-slate-50 hover:bg-violet-50"}`}>{avatar}</button>)}</div>
                  </div>
                  <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                    <input type="checkbox" checked={guardianAttested} onChange={(event) => setGuardianAttested(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-600" />
                    <span>I am a parent/guardian, or I have their permission to create this learner profile and use this email for sign-in.</span>
                  </label>
                  {notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</p>}
                  {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">{error}</p>}
                  <button disabled={busy || !guardianAttested} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700 disabled:bg-slate-300">{busy ? "Sending your code…" : "Create profile and send code ✉️"}</button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-500">Already have a learner profile? <button type="button" onClick={() => switchMode("signin")} className="font-bold text-violet-700 hover:underline">Sign in</button></p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="mt-5 text-5xl" aria-hidden="true">{mode === "register" ? emoji : "✉️"}</div>
            <h1 className="mt-3 text-3xl font-black text-slate-950">Check your inbox{mode === "register" && name ? `, ${name}` : ""}!</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Enter the six-digit code sent to <strong>{email}</strong>. It expires in 10 minutes.</p>
            {notice && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{notice}</p>}
            <form onSubmit={verifyCode} className="mt-5 space-y-3">
              <label className="block text-sm font-bold text-slate-700">Sign-in code
                <input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-3xl font-black tracking-[0.4em] text-slate-950 outline-none focus:ring-2 focus:ring-violet-500" placeholder="000000" />
              </label>
              {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800" role="alert">{error}</p>}
              <button disabled={busy || code.length !== 6} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-700 disabled:bg-slate-300">{busy ? "Opening your study space…" : "Sign in and start learning 🚀"}</button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStage("details"); setCode(""); setError(""); setNotice(""); }} className="font-bold text-slate-600 hover:underline">← Change email or details</button>
              <button type="button" disabled={busy} onClick={() => void requestCode()} className="font-bold text-violet-700 hover:underline disabled:opacity-50">Send a new code</button>
            </div>
          </>
        )}
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">A sign-in code verifies access to an email inbox. Families remain responsible for any permissions needed for a child’s account.</p>
      </section>
    </main>
  );
}
