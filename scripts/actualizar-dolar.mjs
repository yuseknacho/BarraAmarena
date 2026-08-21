#!/usr/bin/env node
// Descarga la cotización histórica del dólar blue (bluelytics.com.ar) y
// guarda el promedio mensual del precio de venta en src/data/dolar-blue.json.
// Uso: node scripts/actualizar-dolar.mjs   (después: npm run build)
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const res = await fetch("https://api.bluelytics.com.ar/v2/evolution.json");
if (!res.ok) throw new Error("No se pudo descargar la cotización: " + res.status);
const all = await res.json();

const sums = {};
for (const r of all) {
  if (r.source !== "Blue" || r.date < "2024-01-01") continue;
  const ym = r.date.slice(0, 7);
  (sums[ym] ??= { total: 0, n: 0 });
  sums[ym].total += r.value_sell;
  sums[ym].n += 1;
}
const monthly = Object.fromEntries(
  Object.keys(sums)
    .sort()
    .map((ym) => [ym, Math.round(sums[ym].total / sums[ym].n)])
);
const out = path.join(root, "src", "data", "dolar-blue.json");
writeFileSync(
  out,
  JSON.stringify({ fuente: "bluelytics.com.ar (promedio mensual, venta)", actualizado: new Date().toISOString().slice(0, 10), meses: monthly }, null, 2)
);
console.log("Guardado", path.relative(root, out), "-", Object.keys(monthly).length, "meses, último:", Object.keys(monthly).at(-1), "=", Object.values(monthly).at(-1));
