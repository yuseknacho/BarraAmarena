import { cookies } from "next/headers";
import { db, terminals, type Terminal } from "@/db";
import { eq } from "drizzle-orm";

export const TERMINAL_COOKIE = "barra_terminal";

// Resuelve la terminal vinculada a este dispositivo (por cookie).
export async function getTerminal(): Promise<Terminal | null> {
  const store = await cookies();
  const token = store.get(TERMINAL_COOKIE)?.value;
  if (!token) return null;
  const terminal = db
    .select()
    .from(terminals)
    .where(eq(terminals.deviceToken, token))
    .get();
  if (!terminal || !terminal.active) return null;
  return terminal;
}
