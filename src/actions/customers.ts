"use server";

import { db, customers } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; ok?: boolean };

export async function createCustomer(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  db.insert(customers)
    .values({
      name,
      docNumber: String(formData.get("docNumber") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .run();
  revalidatePath("/clientes");
  revalidatePath("/pos");
  return { ok: true };
}

export async function updateCustomer(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const existing = db.select().from(customers).where(eq(customers.id, id)).get();
  if (!existing) return { error: "Cliente no encontrado." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  db.update(customers)
    .set({
      name,
      docNumber: String(formData.get("docNumber") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      active: formData.get("active") === "on",
    })
    .where(eq(customers.id, id))
    .run();
  revalidatePath("/clientes");
  revalidatePath("/pos");
  return { ok: true };
}
