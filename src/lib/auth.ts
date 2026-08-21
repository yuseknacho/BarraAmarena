import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import path from "path";
import fs from "fs";
import crypto from "crypto";

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

export async function getUser(): Promise<Required<SessionData> | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return session as Required<SessionData>;
}

export async function requireUser(): Promise<Required<SessionData>> {
  const user = await getUser();
  if (!user) redirect("/login");
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

