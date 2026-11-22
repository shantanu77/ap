import { NextResponse } from "next/server";
import { sendGmailSmtpEmail } from "@/lib/email";
import { getParentNotificationConfig } from "@/lib/parentConfig";
import { prisma } from "@/lib/prisma";
import {
  cleanKidName,
  createOneTimeCode,
  hashOneTimeCode,
  KID_AVATARS,
  normalizeEmail,
  otpExpiry,
  requestAddressHash,
  validEmail,
  validTimezone,
} from "@/lib/kidAuth";

const GENERIC_RESPONSE = { message: "If this email can receive a sign-in code, one is on its way. Check your inbox." };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = cleanKidName(body.name);
    const grade = [6, 7, 8].includes(Number(body.grade)) ? Number(body.grade) : 6;
    const emoji = KID_AVATARS.includes(body.emoji) ? body.emoji : KID_AVATARS[0];
    const timezone = validTimezone(body.timezone);
    if (!validEmail(email) || name.length < 1 || body.guardianAttested !== true) {
      return NextResponse.json({ error: "Enter a valid email and learner name, and ask a parent or guardian to confirm." }, { status: 400 });
    }

    const sender = getParentNotificationConfig();
    if (!sender.senderEmail || !sender.senderPassword) {
      return NextResponse.json({ error: "Sign-in email is temporarily unavailable. Please try again later." }, { status: 503 });
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
    await prisma.loginCode.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
    const ipHash = requestAddressHash(request);
    const [emailCount, addressCount] = await Promise.all([
      prisma.loginCode.count({ where: { email, createdAt: { gte: windowStart } } }),
      prisma.loginCode.count({ where: { requestHash: ipHash, createdAt: { gte: windowStart } } }),
    ]);
    if (emailCount >= 4 || addressCount >= 12) {
      return NextResponse.json({ error: "Too many code requests. Please wait a little before trying again." }, { status: 429 });
    }

    const code = createOneTimeCode();
    await prisma.loginCode.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: now } });
    const challenge = await prisma.loginCode.create({
      data: {
        email,
        codeHash: hashOneTimeCode(email, code),
        draftName: name,
        draftGrade: grade,
        draftEmoji: emoji,
        draftTimezone: timezone,
        attested: true,
        requestHash: ipHash,
        expiresAt: otpExpiry(),
      },
    });

    try {
      await sendGmailSmtpEmail({
        from: sender.senderEmail,
        password: sender.senderPassword,
        to: [email],
        subject: "Your AllShare learning sign-in code",
        text: `Your sign-in code is ${code}. It expires in 10 minutes and can be used once.\n\nIf you did not request this code, you can ignore this email.`,
      });
    } catch {
      await prisma.loginCode.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
      console.error("Could not deliver a learner sign-in email.");
      return NextResponse.json({ error: "We could not send the code just now. Please try again shortly." }, { status: 503 });
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Sign-in code request could not be processed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
