import type { Metadata } from "next";
import GeniusHome from "@/components/genius/GeniusHome";

export const metadata: Metadata = {
  title: "Genius Corner · Aashvath",
  description: "Follow your curiosity through interactive Chemistry lessons.",
};

export default function GeniusCornerPage() {
  return <GeniusHome />;
}
