"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { todayString } from "@/lib/utils";

type Profile = { name: string; emoji: string };

const links = [
  { href: `/session/${todayString()}`, icon: "📅", label: "Today" },
  { href: "/history", icon: "📜", label: "History" },
  { href: "/genius-corner", icon: "🧠", label: "Genius" },
  { href: "/dashboard", icon: "📊", label: "Progress" },
];

export default function KidNavigation() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.ok ? response.json() : null)
      .then((data) => setProfile(data?.profile ?? null)).catch(() => setProfile(null));
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <>
      <header className="sticky top-0 z-50 hidden items-center justify-between bg-indigo-700 px-4 py-3 text-white shadow-md sm:flex">
        <Link href={links[0].href} className="flex min-w-0 items-center gap-2 font-bold text-lg">
          <span aria-hidden="true">{profile?.emoji ?? "⭐"}</span>
          <span className="max-w-36 truncate">{profile?.name ?? "BrightKids"}</span>
          <span className="hidden text-sm font-normal text-indigo-300 md:inline">· Learning Companion</span>
        </Link>
        <nav aria-label="Learning navigation" className="flex items-center gap-1 text-sm">
          {links.map((item) => <Link key={item.label} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="rounded-lg px-2 py-2 hover:bg-indigo-600 md:px-3">{item.icon} <span className="hidden md:inline">{item.label}</span></Link>)}
          <Link href="/profile" aria-label="Account settings" title="Account settings" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20">👤</Link>
        </nav>
      </header>

      <header className="sticky top-0 z-40 flex items-center justify-between bg-indigo-700 px-4 py-2 text-white shadow-md sm:hidden">
        <Link href={links[0].href} className="flex min-w-0 items-center gap-2 font-bold">
          <span className="text-xl" aria-hidden="true">{profile?.emoji ?? "⭐"}</span>
          <span className="max-w-[60vw] truncate">{profile?.name ?? "BrightKids"}</span>
        </Link>
        <Link href="/profile" aria-label="Account settings" title="Account settings" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-xl">👤</Link>
      </header>

      <nav aria-label="Mobile learning navigation" className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-5 gap-0.5 border-t border-indigo-100 bg-white/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 text-indigo-800 shadow-[0_-4px_20px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
        {[
          links[0], links[1], links[2], links[3],
          { href: "/profile", icon: "👤", label: "Profile" },
        ].map((item) => <Link key={item.label} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-h-12 min-w-0 flex-col items-center justify-center rounded-xl px-0.5 text-[9px] font-extrabold leading-tight ${pathname === item.href ? "bg-indigo-100 text-indigo-950" : "hover:bg-indigo-50"}`}>
          <span aria-hidden="true" className="text-lg">{item.icon}</span><span className="max-w-full truncate">{item.label}</span>
        </Link>)}
      </nav>
    </>
  );
}
