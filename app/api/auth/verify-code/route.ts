import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  cleanKidName,
  codeMatches,
  createKidSession,
  kidProfileDTO,
  normalizeEmail,
  validEmail,
} from "@/lib/kidAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const code = String(body.code ?? "").replace(/\s/g, "");
    if (!validEmail(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "That code did not work. Check it and try again." }, { status: 400 });
    }

    const challenge = await prisma.loginCode.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) return NextResponse.json({ error: "That code expired or has already been used. Request a new one." }, { status: 400 });

    const matched = codeMatches(email, code, challenge.codeHash);
    if (!matched) {
      await prisma.loginCode.updateMany({ where: { id: challenge.id, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } });
      return NextResponse.json({ error: "That code did not work. Check it and try again." }, { status: 400 });
    }

    const consumed = await prisma.loginCode.updateMany({ where: { id: challenge.id, consumedAt: null, attempts: { lt: 5 } }, data: { consumedAt: new Date() } });
    if (consumed.count !== 1) return NextResponse.json({ error: "That code was already used. Request a new one." }, { status: 400 });

    const kid = await prisma.$transaction(async (tx) => {
      const existing = await tx.kidProfile.findUnique({ where: { email } });
      if (existing) {
        return tx.kidProfile.update({
          where: { id: existing.id },
          data: { emailVerifiedAt: existing.emailVerifiedAt ?? new Date(), guardianAttestedAt: existing.guardianAttestedAt ?? new Date() },
        });
      }

      const legacy = await tx.kidProfile.findUnique({ where: { id: "legacy-aashvath" } });
      if (legacy && !legacy.email) {
        const board = await tx.boardSettings.findUnique({ where: { kidId: legacy.id } });
        const parent = (process.env.PARENT_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase());
        const configured = [board?.reminderEmail?.trim().toLowerCase(), process.env.EMAIL?.trim().toLowerCase(), process.env.SMTP_USER?.trim().toLowerCase(), ...parent].filter(Boolean);
        if (configured.includes(email)) {
          return tx.kidProfile.update({ where: { id: legacy.id }, data: { email, emailVerifiedAt: new Date(), guardianAttestedAt: new Date() } });
        }
      }

      const name = cleanKidName(challenge.draftName);
      if (!name) throw new Error("The saved learner profile name is invalid.");
      return tx.kidProfile.create({
        data: {
          email,
          name,
          grade: [6, 7, 8].includes(challenge.draftGrade) ? challenge.draftGrade : 6,
          emoji: challenge.draftEmoji,
          timezone: challenge.draftTimezone,
          emailVerifiedAt: new Date(),
          guardianAttestedAt: challenge.attested ? new Date() : null,
        },
      });
    });

    await createKidSession(kid.id);
    return NextResponse.json({ profile: kidProfileDTO(kid) });
  } catch (error) {
    console.error("Sign-in code verification failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
