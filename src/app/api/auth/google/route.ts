import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { buildAuthUrl, googleEnabled } from "@/lib/google";

// Inicio del ingreso con Google. ?mode=login (entrar) o ?mode=link
// (vincular la cuenta de Google al usuario que ya está logueado).
export async function GET(request: NextRequest) {
  if (!googleEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google-config", request.url));
  }
  const mode = request.nextUrl.searchParams.get("mode") === "link" ? "link" : "login";
  const state = `${mode}.${crypto.randomBytes(16).toString("hex")}`;
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 600,
    path: "/",
  });
  return res;
}
