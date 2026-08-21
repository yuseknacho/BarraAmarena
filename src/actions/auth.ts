"use server";

import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Ingresá usuario y contraseña." };
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user || !user.active || !bcrypt.compareSync(password, user.passwordHash)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.fullName = user.fullName;
  session.role = user.role;
  await session.save();
  redirect("/estadisticas");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
