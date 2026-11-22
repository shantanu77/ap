import { NextResponse } from "next/server";
import { revokeCurrentKidSession } from "@/lib/kidAuth";

export async function POST() {
  await revokeCurrentKidSession();
  return NextResponse.json({ success: true });
}
