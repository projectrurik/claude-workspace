import { NextResponse } from "next/server";
import { authCookieValue, COOKIE_NAME, passcodeMatches } from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const attempt = String(form.get("passcode") ?? "");
  const url = new URL(req.url);

  if (!passcodeMatches(attempt)) {
    return NextResponse.redirect(new URL("/login?error=1", url), 303);
  }
  const res = NextResponse.redirect(new URL("/", url), 303);
  res.cookies.set(COOKIE_NAME, authCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
