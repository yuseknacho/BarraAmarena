// Puesta en cero del sistema: borra TODO el historial transaccional
// (ventas, cajas, compras, entregas, movimientos de stock) y deja la
// numeración de tickets en 1. NO toca productos, fotos, categorías,
// usuarios, terminales, configuración ni la Contabilidad Barra.
//
// También elimina definitivamente los productos que estaban marcados
// como "(producto eliminado)", ya que sin historial no hace falta
// conservarlos.
//
// ⚠️ IRREVERSIBLE. Hacé un respaldo antes (Administración → Configuración).
//
// Uso: npx tsx scripts/reset-historial.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const root = path.join(__dirname, "..");
const db = new Database(path.join(root, "data", "barra.db"));
db.pragma("foreign_keys = ON");

// Respaldo automático previo
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupsDir = path.join(root, "data", "backups");
fs.mkdirSync(backupsDir, { recursive: true });
const backupFile = path.join(backupsDir, `pre-reset-${stamp}.db`);
db.prepare(`VACUUM INTO ?`).run(backupFile);
console.log("Respaldo previo:", path.relative(root, backupFile));

const tx = db.transaction(() => {
  db.prepare("DELETE FROM sale_payments").run();
  db.prepare("DELETE FROM sale_items").run();
  db.prepare("DELETE FROM sales").run();
  db.prepare("DELETE FROM cash_movements").run();
  db.prepare("DELETE FROM cash_sessions").run();
  db.prepare("DELETE FROM purchase_items").run();
  db.prepare("DELETE FROM purchases").run();
  db.prepare("DELETE FROM stock_movements").run();
  db.prepare("UPDATE document_counters SET next_number = 1").run();

  // Los productos con borrado lógico ya no tienen historial que preservar
  const softDeleted = db
    .prepare("SELECT id, name, image FROM products WHERE deleted_at IS NOT NULL")
    .all() as { id: number; name: string; image: string | null }[];
  for (const p of softDeleted) {
    db.prepare(
      "DELETE FROM product_components WHERE product_id = ? OR component_product_id = ?"
    ).run(p.id, p.id);
    db.prepare("DELETE FROM products WHERE id = ?").run(p.id);
    if (p.image) {
      try {
        fs.unlinkSync(path.join(root, "data", "uploads", p.image));
      } catch {}
    }
    console.log("Eliminado definitivamente:", p.name);
  }
});
tx();

db.prepare(
  "DELETE FROM sqlite_sequence WHERE name IN ('sales','sale_items','sale_payments','cash_sessions','cash_movements','purchases','purchase_items','stock_movements')"
).run();

const count = (t: string) =>
  (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as { n: number }).n;
console.log("---");
console.log("ventas:", count("sales"), "| cajas:", count("cash_sessions"));
console.log("compras:", count("purchases"), "| mov. stock:", count("stock_movements"));
console.log(
  "próximo ticket:",
  (db.prepare("SELECT next_number FROM document_counters WHERE doc_type='ticket'").get() as { next_number: number }).next_number
);
console.log("productos:", count("products"), "| usuarios:", count("users"), "| terminales:", count("terminals"));
console.log("Sistema en cero, listo para el arranque real.");
