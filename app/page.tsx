import { redirect } from "next/navigation";
import { todayString } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function Home() {
  redirect(`/session/${todayString()}`);
}
