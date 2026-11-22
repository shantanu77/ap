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
      <main className={landing ? "flex-1 w-full" : "flex-1 max-w-6xl w-full mx-auto px-4 py-6"}>
        {children}
      </main>
      {!landing && <footer className="text-center text-xs text-gray-400 py-4">Keep going. Every session counts. 🚀</footer>}
    </>
  );
}
