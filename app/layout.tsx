import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aashvath Learning Companion",
  description: "Daily 1-hour learning session for Aashvath",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        {/* Top nav */}
        <nav className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span>⭐</span>
            <span>{process.env.NEXT_PUBLIC_STUDENT_NAME || "Aashvath"}</span>
            <span className="text-indigo-300 text-sm font-normal hidden sm:inline">
              · Evening Session
            </span>
          </Link>
          <div className="flex gap-1 sm:gap-3 text-sm">
            <Link href="/" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">
              📅 Today
            </Link>
            <Link href="/history" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">
              📜 History
            </Link>
            <Link href="/dashboard" className="px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors">
              📊 Progress
            </Link>
          </div>
        </nav>

        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="text-center text-xs text-gray-400 py-4">
          Keep going, Aashvath. Every session counts. 🚀
        </footer>
      </body>
    </html>
  );
}
