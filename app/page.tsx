import { redirect } from "next/navigation";
import { todayString } from "@/lib/utils";

export default function Home() {
  redirect(`/session/${todayString()}`);
}
