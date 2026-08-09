"use server";

import { db, ledgerEntries } from "@/db";
import { eq } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/auth";
import { pesosToCents } from "@/lib/money";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; ok?: boolean };

export async function createLedgerEntry(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSuperAdmin();

  const date = String(formData.get("date") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const amount = pesosToCents(String(formData.get("amount") ?? "0"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Fecha inválida." };
  if (!category) return { error: "Indicá la categoría." };
  if (!name) return { error: "Indicá el nombre del movimiento." };
  if (type !== "ingreso" && type !== "egreso") return { error: "Tipo inválido." };
  if (amount <= 0) return { error: "El monto debe ser mayor a cero." };

  db.insert(ledgerEntries)
    .values({
      date,
      category,
      name,
      type,
      amountCents: amount,
      createdByUserId: user.userId,
    })
    .run();

  revalidatePath("/contabilidad");
  return { ok: true };
}

export async function deleteLedgerEntry(id: number): Promise<ActionResult> {
  await requireSuperAdmin();
  const entry = db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.id, id))
    .get();
  if (!entry) return { error: "Movimiento no encontrado." };
  db.delete(ledgerEntries).where(eq(ledgerEntries.id, id)).run();
  revalidatePath("/contabilidad");
  return { ok: true };
}
