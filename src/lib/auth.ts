import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

// Roles: "superadmin" administra usuarios y todo lo demás;
// "admin" puede cargar y editar toda la información pero no gestionar usuarios.
export interface SessionData {
  userId?: number;
  username?: string;
  fullName?: string;
  role?: "superadmin" | "admin" | "cajero" | "barman";
}

// El secreto se genera una vez y se guarda en data/ para que el sistema
// funcione sin configurar variables de entorno.
function getSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(process.cwd(), "data", ".session-secret");
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const secret = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(file, secret, { mode: 0o600 });
    return secret;
  }
}

export const sessionOptions: SessionOptions = {
  password: getSecret(),
  cookieName: "barra_session",
  ttl: 60 * 60 * 24 * 14, // 14 días
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    // HTTP plano en LAN: la cookie no puede ser "secure"
    secure: false,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// Además de la cookie, se verifica en la base que el usuario siga existiendo
// y activo: si se lo eliminó o desactivó, la sesión deja de valer al instante.
// El rol y el nombre se toman siempre de la base (por si se editaron).
export async function getUser(): Promise<Required<SessionData> | null> {
  const session = await getSession();
  if (!session.userId) return null;
  const u = db
    .select({
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      role: users.role,
      active: users.active,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();
  if (!u || !u.active || u.deletedAt) return null;
  return { userId: u.id, username: u.username, fullName: u.fullName, role: u.role };
}

export async function requireUser(): Promise<Required<SessionData>> {
  const user = await getUser();
  // /login?salir=1 borra la cookie (el proxy no deja ver /login con cookie)
  if (!user) redirect("/login?salir=1");
  return user;
}

// Super Admin o Administrador: pueden cargar información en todo el sistema.
export async function requireAdmin(): Promise<Required<SessionData>> {
  const user = await requireUser();
  if (user.role !== "superadmin" && user.role !== "admin") redirect("/login");
  return user;
}

// Solo el Super Admin: gestión de usuarios.
export async function requireSuperAdmin(): Promise<Required<SessionData>> {
  const user = await requireUser();
  if (user.role !== "superadmin") redirect("/estadisticas");
  return user;
}

