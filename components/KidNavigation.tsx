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
    <nav className="bg-indigo-700 text-white px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <Link href={`/session/${todayString()}`} className="flex min-w-0 items-center gap-2 font-bold text-lg">
        <span>{profile?.emoji ?? "⭐"}</span>
        <span className="hidden sm:inline max-w-36 truncate">{profile?.name ?? "AllShare"}</span>
        <span className="text-indigo-300 text-sm font-normal hidden sm:inline">· Learning Companion</span>
      </Link>
      <div className="flex items-center gap-0.5 sm:gap-1 text-sm overflow-x-auto">
        <Link href={`/session/${todayString()}`} className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📅 <span className="hidden md:inline">Today</span></Link>
        <Link href="/genius-corner" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap">🧠 <span className="hidden md:inline">Genius Corner</span></Link>
        <Link href="/genius-corner/saved" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap">🔖 <span className="hidden md:inline">Saved Topics</span></Link>
        <Link href="/history" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📜 <span className="hidden md:inline">History</span></Link>
        <Link href="/dashboard" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">📊 <span className="hidden md:inline">Progress</span></Link>
        <button type="button" onClick={() => void logout()} className="ml-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-bold hover:bg-white/20">Log out</button>
      </div>
    </nav>
  );
}
