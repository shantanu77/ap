import type { Metadata } from "next";
import GeniusHome from "@/components/genius/GeniusHome";

export const metadata: Metadata = {
  title: "Genius Corner · BrightKids.Space",
  description: "Follow your curiosity through interactive Chemistry, Physics, Biology, and NCERT-aligned Math lessons.",
};

export default function GeniusCornerPage() {
  return <GeniusHome />;
}
