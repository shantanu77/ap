import "server-only";

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { KID_AVATARS } from "@/lib/kidProfile";

export const KID_SESSION_COOKIE = "ap_kid_session";
export { KID_AVATARS } from "@/lib/kidProfile";
const SESSION_DAYS = 180;
const OTP_MINUTES = 10;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  return value;
}

export function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase().slice(0, 191);
}

export function validEmail(value: string) {
  return value.length <= 191 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function cleanKidName(value: unknown) {
  return String(value ?? "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 60);
}

export function validTimezone(value: unknown) {
  const timezone = String(value ?? "").trim().slice(0, 80);
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
    return timezone;
  } catch {
    return "Asia/Kolkata";
  }
}

export function hashRequestValue(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function hashSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashCode(email: string, code: string) {
  return hashRequestValue(`login-code:${email}:${code}`);
}

export function createOneTimeCode() {
  return randomInt(100000, 1000000).toString();
}

export function codeMatches(email: string, code: string, expectedHash: string) {
  const actual = Buffer.from(hashCode(email, code), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashOneTimeCode(email: string, code: string) {
  return hashCode(email, code);
}

export function requestAddressHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return hashRequestValue(`request-address:${address}`);
}

export async function createKidSession(kidId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { kidId, tokenHash: hashSession(token), expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set(KID_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAuthenticatedKid() {
  const cookieStore = await cookies();
  const token = cookieStore.get(KID_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashSession(token) },
    include: { kid: true },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.kid.email) return null;

  const now = new Date();
  if (session.expiresAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
    const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.authSession.update({ where: { id: session.id }, data: { expiresAt, lastSeenAt: now } });
    cookieStore.set(KID_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }
  return session.kid;
}

export async function revokeCurrentKidSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(KID_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.updateMany({
      where: { tokenHash: hashSession(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(KID_SESSION_COOKIE);
}

export function kidProfileDTO(kid: { id: string; email: string | null; name: string; grade: number; emoji: string; timezone: string }) {
  return { id: kid.id, email: kid.email, name: kid.name, grade: kid.grade, emoji: kid.emoji, timezone: kid.timezone };
}

export function otpExpiry() {
  return new Date(Date.now() + OTP_MINUTES * 60 * 1000);
}
