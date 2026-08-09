"use server";

import {
  db,
  sqlite,
  users,
  sales,
  cashSessions,
  cashMovements,
  stockMovements,
  purchases,
  ledgerEntries,
} from "@/db";
import { eq, and, ne, isNull, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userSchema = z.object({
  username: z.string().min(1, "Usuario requerido").regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números y . _ -"),
  fullName: z.string().min(1, "Nombre requerido"),
  role: z.enum(["superadmin", "cajero", "barman"]),
});

export type ActionResult = { error?: string; ok?: boolean };

export async function createUser(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
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
    | "cajero"
    | "barman";
  const password = String(formData.get("password") ?? "");
  const active = formData.get("active") === "on";

  if (!fullName) return { error: "Nombre requerido." };
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

export type DeleteUserResult = { error?: string; ok?: boolean; info?: string };

// Elimina un usuario. Si tiene actividad registrada (ventas, cajas,
// movimientos), se hace borrado lógico: sale de la lista pero el
// historial conserva su nombre.
export async function deleteUser(id: number): Promise<DeleteUserResult> {
  const actor = await requireAdmin();

  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user || user.deletedAt) return { error: "Usuario no encontrado." };

  if (id === actor.userId)
    return { error: "No podés eliminarte a vos mismo." };

  if (user.role === "superadmin") {
    const otros = db
      .select({ n: sql<number>`COUNT(*)` })
      .from(users)
      .where(
        and(
          eq(users.role, "superadmin"),
          eq(users.active, true),
          isNull(users.deletedAt),
          ne(users.id, id)
        )
      )
      .get()!.n;
    if (otros === 0)
      return {
        error:
          "Es el único Super Admin activo: si lo eliminás, nadie puede administrar el sistema.",
      };
  }

  // ¿Tiene actividad registrada en el sistema?
  const refs =
    db.select({ n: sql<number>`COUNT(*)` }).from(sales).where(
      or(
        eq(sales.userId, id),
        eq(sales.voidedByUserId, id),
        eq(sales.redeemedByUserId, id)
      )
    ).get()!.n +
    db.select({ n: sql<number>`COUNT(*)` }).from(cashSessions).where(
      or(eq(cashSessions.openedByUserId, id), eq(cashSessions.closedByUserId, id))
    ).get()!.n +
    db.select({ n: sql<number>`COUNT(*)` }).from(cashMovements)
      .where(eq(cashMovements.userId, id)).get()!.n +
    db.select({ n: sql<number>`COUNT(*)` }).from(stockMovements)
      .where(eq(stockMovements.userId, id)).get()!.n +
    db.select({ n: sql<number>`COUNT(*)` }).from(purchases)
      .where(eq(purchases.userId, id)).get()!.n +
    db.select({ n: sql<number>`COUNT(*)` }).from(ledgerEntries)
      .where(eq(ledgerEntries.createdByUserId, id)).get()!.n;

  if (refs > 0) {
    // Borrado lógico: libera el nombre de usuario para reutilizarlo
    db.update(users)
      .set({
        deletedAt: new Date().toISOString(),
        active: false,
        username: `${user.username}.eliminado.${id}`,
      })
      .where(eq(users.id, id))
      .run();
    revalidatePath("/admin/usuarios");
    return {
      ok: true,
      info: `"${user.fullName}" se eliminó. Como tenía actividad registrada, su nombre se conserva en el historial de ventas y cajas.`,
    };
  }

  db.delete(users).where(eq(users.id, id)).run();
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
