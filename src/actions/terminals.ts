"use server";

import { db, terminals } from "@/db";
import { eq, isNull, and } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth";
import { TERMINAL_COOKIE } from "@/lib/terminal";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "crypto";

export type ActionResult = { error?: string; ok?: boolean };

export async function createTerminal(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  const dup = db
    .select({ id: terminals.id })
    .from(terminals)
    .where(eq(terminals.name, name))
    .get();
  if (dup) return { error: "Ya existe una terminal con ese nombre." };
  db.insert(terminals).values({ name }).run();
  revalidatePath("/admin/terminales");
  return { ok: true };
}

// Vincula este dispositivo (navegador) a una terminal libre.
export async function linkTerminal(formData: FormData): Promise<void> {
  await requireUser();
  const terminalId = Number(formData.get("terminalId"));
  const terminal = db
    .select()
    .from(terminals)
    .where(
      and(
        eq(terminals.id, terminalId),
        eq(terminals.active, true),
        isNull(terminals.deviceToken)
      )
    )
    .get();
  if (!terminal) return;

  const token = crypto.randomUUID();
  db.update(terminals)
    .set({ deviceToken: token })
    .where(eq(terminals.id, terminalId))
    .run();

  const store = await cookies();
  store.set(TERMINAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 60 * 60 * 24 * 365 * 5,
    path: "/",
  });
  redirect("/caja");
}

// Desvincula el dispositivo de una terminal (permite re-vincular otro).
export async function unlinkTerminal(formData: FormData): Promise<void> {
  await requireAdmin();
  const terminalId = Number(formData.get("terminalId"));
  db.update(terminals)
    .set({ deviceToken: null })
    .where(eq(terminals.id, terminalId))
    .run();
  revalidatePath("/admin/terminales");
}

export async function setTerminalActive(formData: FormData): Promise<void> {
  await requireAdmin();
  const terminalId = Number(formData.get("terminalId"));
  const active = formData.get("active") === "1";
  db.update(terminals)
    .set({ active, ...(active ? {} : { deviceToken: null }) })
    .where(eq(terminals.id, terminalId))
    .run();
  revalidatePath("/admin/terminales");
}
