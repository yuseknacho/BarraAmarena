"use server";

import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";
import { sqlite } from "@/db";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";

export type ActionResult = { error?: string; ok?: boolean; message?: string };

export async function saveSettings(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const ticketWidth = String(formData.get("ticketWidth") ?? "80");
  const ticketFooter = String(formData.get("ticketFooter") ?? "").trim();

  if (!businessName) return { error: "El nombre del negocio es requerido." };
  if (ticketWidth !== "58" && ticketWidth !== "80")
    return { error: "Ancho de ticket inválido." };

  setSetting("business_name", businessName);
  setSetting("ticket_width", ticketWidth);
  setSetting("ticket_footer", ticketFooter);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Copia consistente de la base incluso con el sistema en uso (VACUUM INTO).
export async function createBackup(
  _prev: ActionResult | undefined,
  _formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const backupsDir = path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(backupsDir, { recursive: true });

  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);
  const file = path.join(backupsDir, `barra-${stamp}.db`);

  try {
    sqlite.prepare(`VACUUM INTO ?`).run(file);
    return { ok: true, message: `Respaldo creado: data/backups/barra-${stamp}.db` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el respaldo." };
  }
}
