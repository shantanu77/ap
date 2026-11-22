import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BrightKids.Space — Make ‘why?’ your favourite question",
  description: "Big ideas, made clear. Explore interactive school lessons built for Grades 6–8.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
