import type { Metadata } from "next";
import SavedTopics from "@/components/genius/SavedTopics";

export const metadata: Metadata = {
  title: "Saved Topics · Genius Corner",
};

export default function SavedTopicsPage() {
  return <SavedTopics />;
}
