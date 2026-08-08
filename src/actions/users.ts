"use server";

import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(1, "Usuario requerido").regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números y . _ -"),
  fullName: z.string().min(1, "Nombre requerido"),
  role: z.enum(["superadmin", "admin", "cajero"]),
});

export type ActionResult = { error?: string; ok?: boolean };

export async function createUser(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const actor = await requireAdmin();
  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.role === "superadmin" && actor.role !== "superadmin") {
    return { error: "Solo un Super Admin puede crear otro Super Admin." };
  }
  const password = String(formData.get("password") ?? "");
  if (password.length < 4) return { error: "La contraseña debe tener al menos 4 caracteres." };

  const exists = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, parsed.data.username))
    .get();
  if (exists) return { error: "Ya existe un usuario con ese nombre." };

  db.insert(users)
    .values({
      username: parsed.data.username,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      passwordHash: bcrypt.hashSync(password, 10),
    })
    .run();
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function updateUser(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return { error: "Usuario no encontrado." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? user.role) as
    | "superadmin"
    | "admin"
    | "cajero";
  const password = String(formData.get("password") ?? "");
  const active = formData.get("active") === "on";

  if (!fullName) return { error: "Nombre requerido." };
  if (
    (user.role === "superadmin" || role === "superadmin") &&
    admin.role !== "superadmin"
  ) {
    return { error: "Solo un Super Admin puede gestionar cuentas Super Admin." };
  }
  if (id === admin.userId && (role !== admin.role || !active)) {
    return { error: "No podés desactivarte ni cambiarte el rol a vos mismo." };
  }

  db.update(users)
    .set({
      fullName,
      role,
      active,
      ...(password ? { passwordHash: bcrypt.hashSync(password, 10) } : {}),
    })
    .where(eq(users.id, id))
    .run();
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
