"use server";

import { db, sqlite, cashSessions, cashMovements } from "@/db";
import { eq } from "drizzle-orm";
import { requireSeller } from "@/lib/auth";
import { getTerminal } from "@/lib/terminal";
import { computeExpectedCash, getOpenSession } from "@/lib/cash";
import { pesosToCents } from "@/lib/money";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string; ok?: boolean };

export async function openCashSession(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSeller();
  const terminal = await getTerminal();
  if (!terminal) return { error: "Este dispositivo no tiene terminal vinculada." };

  const opening = pesosToCents(String(formData.get("openingAmount") ?? "0"));
  if (opening < 0) return { error: "Monto inválido." };

  try {
    db.insert(cashSessions)
      .values({
        terminalId: terminal.id,
        openedByUserId: user.userId,
        openingAmountCents: opening,
      })
      .run();
  } catch {
    return { error: "Ya hay una caja abierta en esta terminal." };
  }

  revalidatePath("/caja");
  revalidatePath("/pos");
  return { ok: true };
}

export async function addCashMovement(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSeller();
  const terminal = await getTerminal();
  if (!terminal) return { error: "Este dispositivo no tiene terminal vinculada." };

  const session = getOpenSession(terminal.id);
  if (!session) return { error: "No hay caja abierta en esta terminal." };

  const type = String(formData.get("type"));
  if (type !== "ingreso" && type !== "egreso") return { error: "Tipo inválido." };
  const amount = pesosToCents(String(formData.get("amount") ?? "0"));
  if (amount <= 0) return { error: "El monto debe ser mayor a cero." };
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { error: "Indicá el motivo del movimiento." };

  db.insert(cashMovements)
    .values({
      cashSessionId: session.id,
      type,
      amountCents: amount,
      reason,
      userId: user.userId,
    })
    .run();

  revalidatePath("/caja");
  return { ok: true };
}

export async function closeCashSession(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireSeller();
  const terminal = await getTerminal();
  if (!terminal) return { error: "Este dispositivo no tiene terminal vinculada." };

  const session = getOpenSession(terminal.id);
  if (!session) return { error: "No hay caja abierta en esta terminal." };

  const counted = pesosToCents(String(formData.get("countedCash") ?? ""));
  if (counted < 0 || formData.get("countedCash") === null)
    return { error: "Ingresá el efectivo contado." };
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const tx = sqlite.transaction(() => {
    const expected = computeExpectedCash(session.id);
    db.update(cashSessions)
      .set({
        status: "closed",
        closedByUserId: user.userId,
        closedAt: new Date().toISOString(),
        expectedCashCents: expected,
        countedCashCents: counted,
        differenceCents: counted - expected,
        notes,
      })
      .where(eq(cashSessions.id, session.id))
      .run();
  });
  tx();

  revalidatePath("/caja");
  revalidatePath("/pos");
  return { ok: true };
}
