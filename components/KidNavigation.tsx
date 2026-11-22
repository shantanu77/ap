"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { todayString } from "@/lib/utils";

type Profile = { name: string; emoji: string };

export default function KidNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/auth/me").then((response) => response.ok ? response.json() : null)
      .then((data) => setProfile(data?.profile ?? null)).catch(() => setProfile(null));
  }, [pathname]);

  if (pathname === "/login") return null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-indigo-700 px-2 py-2 text-white shadow-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <Link href={`/session/${todayString()}`} className="flex min-w-0 items-center gap-2 rounded-lg py-1 font-bold">
          <span className="text-xl" aria-hidden="true">{profile?.emoji ?? "⭐"}</span>
          <span className="max-w-[min(52vw,15rem)] truncate text-sm">{profile?.name ?? "BrightKids"}</span>
        </Link>
        <button type="button" onClick={() => void logout()} className="min-h-10 shrink-0 rounded-lg bg-white/10 px-3 text-xs font-bold hover:bg-white/20">Log out</button>
      </div>
      <div className="grid grid-cols-5 gap-1 text-center sm:hidden" aria-label="Learning navigation">
        {[
          { href: `/session/${todayString()}`, icon: "📅", label: "Today" },
          { href: "/genius-corner", icon: "🧠", label: "Genius" },
          { href: "/genius-corner/saved", icon: "🔖", label: "Saved" },
          { href: "/history", icon: "📜", label: "History" },
          { href: "/dashboard", icon: "📊", label: "Progress" },
        ].map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 min-w-0 flex-col items-center justify-center rounded-lg px-0.5 text-[10px] font-bold leading-tight hover:bg-indigo-600"><span className="text-base" aria-hidden="true">{item.icon}</span><span className="max-w-full truncate">{item.label}</span></Link>)}
      </div>
      <div className="hidden items-center justify-between sm:flex">
      <Link href={`/session/${todayString()}`} className="flex min-w-0 items-center gap-2 font-bold text-lg">
        <span>{profile?.emoji ?? "⭐"}</span>
        <span className="hidden sm:inline max-w-36 truncate">{profile?.name ?? "AllShare"}</span>
        <span className="text-indigo-300 text-sm font-normal hidden sm:inline">· Learning Companion</span>
      </Link>
      <div className="flex items-center gap-0.5 text-sm">
        <Link href={`/session/${todayString()}`} className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📅 <span className="hidden md:inline">Today</span></Link>
        <Link href="/genius-corner" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap">🧠 <span className="hidden md:inline">Genius Corner</span></Link>
        <Link href="/genius-corner/saved" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap">🔖 <span className="hidden md:inline">Saved Topics</span></Link>
        <Link href="/history" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📜 <span className="hidden md:inline">History</span></Link>
        <Link href="/dashboard" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📊 <span className="hidden md:inline">Progress</span></Link>
        <button type="button" onClick={() => void logout()} className="ml-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold hover:bg-white/20">Log out</button>
      </div>
      </div>
    </nav>
  );
}
