import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// A single passcode (APP_PASSCODE) protects the app, so strangers can't run
// up your Claude API bill. The cookie stores a hash, never the passcode.

export const COOKIE_NAME = "brief_auth";

function token(): string {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) throw new Error("APP_PASSCODE is not set");
  return createHash("sha256").update(`daily-brief:${passcode}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passcodeMatches(attempt: string) {
  const passcode = process.env.APP_PASSCODE;
  return !!passcode && safeEqual(attempt, passcode);
}

export function authCookieValue() {
  return token();
}

export async function isAuthed(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return !!value && safeEqual(value, token());
}

export async function requireAuth() {
  if (!(await isAuthed())) redirect("/login");
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function isCron(req: Request) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  return !!secret && safeEqual(header, `Bearer ${secret}`);
}
