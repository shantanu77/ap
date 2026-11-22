import { NextResponse } from "next/server";
import { getAuthenticatedKid, kidProfileDTO, KID_AVATARS, cleanKidName } from "@/lib/kidAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  return NextResponse.json({ profile: kidProfileDTO(kid) });
}

export async function PATCH(request: Request) {
  const kid = await getAuthenticatedKid();
  if (!kid) return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  try {
    const body = await request.json();
    const name = body.name === undefined ? kid.name : cleanKidName(body.name);
    const grade = body.grade === undefined ? kid.grade : Number(body.grade);
    const emoji = body.emoji === undefined ? kid.emoji : body.emoji;
    const timezone = body.timezone === undefined ? kid.timezone : String(body.timezone).slice(0, 80);
    if (!name || name.length > 60 || ![6, 7, 8].includes(grade) || !KID_AVATARS.includes(emoji)) {
      return NextResponse.json({ error: "Check the name, grade, and avatar, then try again." }, { status: 400 });
    }
    try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch {
      return NextResponse.json({ error: "Choose a valid time zone." }, { status: 400 });
    }
    const updated = await prisma.kidProfile.update({ where: { id: kid.id }, data: { name, grade, emoji, timezone } });
    return NextResponse.json({ profile: kidProfileDTO(updated) });
  } catch {
    return NextResponse.json({ error: "Could not update the learner profile." }, { status: 500 });
  }
}
