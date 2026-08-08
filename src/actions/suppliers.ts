"use server";

import { db, suppliers } from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; ok?: boolean };

export async function createSupplier(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  db.insert(suppliers)
    .values({
      name,
      cuit: String(formData.get("cuit") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .run();
  revalidatePath("/proveedores");
  return { ok: true };
}

export async function updateSupplier(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const existing = db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  if (!existing) return { error: "Proveedor no encontrado." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  db.update(suppliers)
    .set({
      name,
      cuit: String(formData.get("cuit") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      active: formData.get("active") === "on",
    })
    .where(eq(suppliers.id, id))
    .run();
  revalidatePath("/proveedores");
  return { ok: true };
}
