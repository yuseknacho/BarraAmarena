import fs from "fs";
import path from "path";
import snapshot from "@/data/dolar-blue.json";

// Dólar blue: promedio mensual del precio de venta (bluelytics.com.ar).
// Se actualiza solo: consulta la API al abrir Estadísticas (como mucho cada
// 12 horas) y guarda lo descargado en data/dolar-blue.json. Si no hay
// internet, usa lo último guardado (o el snapshot que viene con el sistema).

const API = "https://api.bluelytics.com.ar/v2/evolution.json";
const CACHE_MS = 12 * 60 * 60 * 1000;
const FILE = path.join(process.cwd(), "data", "dolar-blue.json");

type Monthly = Record<string, number>;
type Stored = { actualizado: string; meses: Monthly };

const g = globalThis as unknown as { __dolarCache?: { at: number; data: Stored } };

function readStored(): Stored {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as Stored;
  } catch {
    return { actualizado: snapshot.actualizado, meses: snapshot.meses as Monthly };
  }
}

async function fetchMonthly(): Promise<Monthly> {
  const res = await fetch(API, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const all = (await res.json()) as { date: string; source: string; value_sell: number }[];
  const sums: Record<string, { total: number; n: number }> = {};
  for (const r of all) {
    if (r.source !== "Blue" || r.date < "2024-01-01") continue;
    const ym = r.date.slice(0, 7);
    (sums[ym] ??= { total: 0, n: 0 }).total += r.value_sell;
    sums[ym].n += 1;
  }
  return Object.fromEntries(
    Object.keys(sums).sort().map((ym) => [ym, Math.round(sums[ym].total / sums[ym].n)])
  );
}

export async function getDolarBlueMensual(): Promise<Stored> {
  const now = Date.now();
  if (g.__dolarCache && now - g.__dolarCache.at < CACHE_MS) return g.__dolarCache.data;

  let data = readStored();
  try {
    const meses = await fetchMonthly();
    if (Object.keys(meses).length > 0) {
      data = { actualizado: new Date().toISOString().slice(0, 10), meses };
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    }
  } catch {
    // sin internet: seguimos con lo guardado
  }
  g.__dolarCache = { at: now, data };
  return data;
}
