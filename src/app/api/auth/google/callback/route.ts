import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { db, users } from "@/db";
import { and, eq, isNull, or } from "drizzle-orm";
import { fetchGoogleProfile, googleEnabled } from "@/lib/google";
import { sessionOptions, type SessionData } from "@/lib/auth";

// Vuelta desde Google: valida el código y entra (o vincula la cuenta).
export async function GET(request: NextRequest) {
  const base = request.url;
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google-config", base));

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const saved = request.cookies.get("google_oauth_state")?.value;
  if (!code || !state || !saved || state !== saved) {
    return NextResponse.redirect(new URL("/login?error=google-state", base));
  }
  const mode = state.startsWith("link.") ? "link" : "login";

  let profile;
  try {
    profile = await fetchGoogleProfile(code);
  } catch {
    return NextResponse.redirect(new URL("/login?error=google", base));
  }
  if (!profile.emailVerified) {
    return NextResponse.redirect(new URL("/login?error=google-unverified", base));
  }

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (mode === "link") {
    // Vincular a la cuenta logueada: completa nombre, email y foto desde Google
    if (!session.userId) return NextResponse.redirect(new URL("/login", base));
    const taken = db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, profile.email), isNull(users.deletedAt)))
      .get();
    if (taken && taken.id !== session.userId) {
      return NextResponse.redirect(new URL("/admin?google=ocupado", base));
    }
    db.update(users)
      .set({
        email: profile.email,
        googleSub: profile.sub,
        avatarUrl: profile.picture,
        fullName: profile.name,
      })
      .where(eq(users.id, session.userId))
      .run();
    session.fullName = profile.name;
    await session.save();
    const res = NextResponse.redirect(new URL("/admin?google=vinculada", base));
    res.cookies.delete("google_oauth_state");
    return res;
  }

  // Ingresar: solo cuentas de Google ya habilitadas (por email o por id de Google)
  const user = db
    .select()
    .from(users)
    .where(
      and(
        or(eq(users.googleSub, profile.sub), eq(users.email, profile.email)),
        eq(users.active, true),
        isNull(users.deletedAt)
      )
    )
    .get();
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=google-no-habilitada", base));
  }

  // Autocompletar datos del perfil de Google
  db.update(users)
    .set({
      googleSub: profile.sub,
      email: profile.email,
      avatarUrl: profile.picture,
      fullName: profile.name,
    })
    .where(eq(users.id, user.id))
    .run();

  session.userId = user.id;
  session.username = user.username;
  session.fullName = profile.name;
  session.role = user.role;
  await session.save();
  const res = NextResponse.redirect(new URL("/estadisticas", base));
  res.cookies.delete("google_oauth_state");
  return res;
}
