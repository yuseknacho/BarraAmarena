import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "data", "barra.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

// Singleton que sobrevive al hot-reload de Next en desarrollo
const globalForDb = globalThis as unknown as {
  __barraDb?: ReturnType<typeof createDb>;
};

function createDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  seedDefaults(sqlite);
  return { db, sqlite };
}

function seedDefaults(sqlite: Database.Database) {
  sqlite
    .prepare(
      "INSERT OR IGNORE INTO document_counters (doc_type, next_number) VALUES ('ticket', 1), ('presupuesto', 1)"
    )
    .run();
  const defaults: Record<string, string> = {
    business_name: "Mi Negocio",
    ticket_width: "80",
    ticket_footer: "¡Gracias por su compra!",
  };
  const ins = sqlite.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [k, v] of Object.entries(defaults)) ins.run(k, v);
}

const instance = globalForDb.__barraDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.__barraDb = instance;

export const db = instance.db;
export const sqlite = instance.sqlite;
export * from "./schema";
