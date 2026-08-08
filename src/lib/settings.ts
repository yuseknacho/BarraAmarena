import { db, settings } from "@/db";
import { eq } from "drizzle-orm";

export function getSetting(key: string): string {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? "";
}

export function getAllSettings(): Record<string, string> {
  const rows = db.select().from(settings).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function setSetting(key: string, value: string) {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}
