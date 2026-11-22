import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import KidNavigation from "@/components/KidNavigation";

export const metadata: Metadata = {
  title: "AllShare Learning Companion",
  description: "A personal learning space for curious students.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <KidNavigation />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          {children}
        </main>

        <footer className="text-center text-xs text-gray-400 py-4">
          Keep going. Every session counts. 🚀
        </footer>
      </body>
    </html>
  );
}
