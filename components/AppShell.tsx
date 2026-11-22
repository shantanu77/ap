"use client";

import { usePathname } from "next/navigation";
import KidNavigation from "@/components/KidNavigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/";
  const login = pathname === "/login";

  return (
    <>
      {!landing && !login && <KidNavigation />}
      <main className={landing ? "flex-1 w-full min-w-0" : "mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-6"}>
        {children}
      </main>
      {!landing && <footer className="pb-20 pt-4 text-center text-xs text-gray-400 sm:py-4">Keep going. Every session counts. 🚀</footer>}
    </>
  );
}
