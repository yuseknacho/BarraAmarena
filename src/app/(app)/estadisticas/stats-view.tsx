"use client";

import { useMemo, useState } from "react";
import { StatsChart, type StatPoint } from "@/components/stats-chart";
import { formatCents } from "@/lib/money";

type Entry = {
  date: string; // YYYY-MM-DD
  type: "ingreso" | "egreso";
  amountCents: number;
  category: string;
  name?: string;
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Retiros de los socios: categoría "Retiro" (o el concepto clásico de la planilla)
const isRetiro = (e: Entry) =>
  e.type === "egreso" &&
  (/^retiro$/i.test(e.category.trim()) || /retiro.*nahuel.*nelsi.*miguel/i.test(e.name ?? ""));

const selectCls =
  "bg-neutral-900 border border-white/10 p-2 rounded text-white focus:border-brand outline-none";

const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
};
const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-");
  return `${MESES[Number(m) - 1].slice(0, 3)} ${y}`;
};

export function StatsView({ entries }: { entries: Entry[] }) {
  const currentYear = String(new Date().getFullYear());
  const years = useMemo(() => {
    const set = new Set(entries.map((e) => e.date.slice(0, 4)));
    set.add(currentYear);
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [entries, currentYear]);

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(""); // "" = todo el año

  // Movimientos del período elegido
  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (year && e.date.slice(0, 4) !== year) return false;
        if (month && e.date.slice(5, 7) !== month.padStart(2, "0")) return false;
        return true;
      }),
    [entries, year, month]
  );

  // Puntos del gráfico: por día si hay mes elegido, por mes si no
  const points = useMemo<StatPoint[]>(() => {
    const byKey = new Map<string, { ingresos: number; gastos: number; retiros: number }>();
    for (const e of filtered) {
      const key = month ? e.date : e.date.slice(0, 7);
      const acc = byKey.get(key) ?? { ingresos: 0, gastos: 0, retiros: 0 };
      if (e.type === "ingreso") acc.ingresos += e.amountCents;
      else if (isRetiro(e)) acc.retiros += e.amountCents;
      else acc.gastos += e.amountCents;
      byKey.set(key, acc);
    }
    return [...byKey.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        label: month ? fmtDay(key) : fmtMonth(key),
        ingresosCents: v.ingresos,
        gastosCents: v.gastos,
        retirosCents: v.retiros,
      }));
  }, [filtered, month]);

  const totalIngresos = filtered
    .filter((e) => e.type === "ingreso")
    .reduce((a, e) => a + e.amountCents, 0);
  const totalRetiros = filtered.filter(isRetiro).reduce((a, e) => a + e.amountCents, 0);
  const totalGastos = filtered
    .filter((e) => e.type === "egreso" && !isRetiro(e))
    .reduce((a, e) => a + e.amountCents, 0);
  const totalEgresos = totalGastos + totalRetiros;
  const resultado = totalIngresos - totalEgresos;

  // Egresos por categoría del período (de mayor a menor)
  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filtered)
      if (e.type === "egreso" && !isRetiro(e))
        map.set(e.category, (map.get(e.category) ?? 0) + e.amountCents);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  return (
    <div>
      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-white/60">Año:</label>
        <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Todos</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <label className="text-sm text-white/60 ml-2">Mes:</label>
        <select className={selectCls} value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Todos</option>
          {MESES.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
          <p className="text-2xl md:text-3xl font-bold text-brand">{formatCents(totalIngresos)}</p>
          <p className="text-white/60 text-sm mt-1">🟢 Ingresos</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
          <p className="text-2xl md:text-3xl font-bold text-yellow-400">{formatCents(totalGastos)}</p>
          <p className="text-white/60 text-sm mt-1">🟡 Gastos</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
          <p className="text-2xl md:text-3xl font-bold text-red-400">{formatCents(totalRetiros)}</p>
          <p className="text-white/60 text-sm mt-1">🔴 Retiros Nahuel-Nelsi-Miguel</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl">
          <p
            className={`text-2xl md:text-3xl font-bold ${resultado >= 0 ? "text-white" : "text-red-400"}`}
          >
            {formatCents(resultado)}
          </p>
          <p className="text-white/60 text-sm mt-1">Resultado del período · {filtered.length} mov.</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-1 rounded" style={{ background: "#4fd41f" }} />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-1 rounded" style={{ background: "#eab308" }} />
            Gastos
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-4 h-1 rounded" style={{ background: "#ef4444" }} />
            Retiros Nahuel-Nelsi-Miguel
          </span>
          <span className="ml-auto text-xs text-white/40">
            {month ? "Evolución día por día" : "Evolución mes a mes"}
          </span>
        </div>
        <StatsChart data={points} />
      </div>

      {/* Gastos por categoría */}
      {porCategoria.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 mt-6">
          <h3 className="font-semibold mb-3">En qué se fue la plata</h3>
          <div className="space-y-2">
            {porCategoria.map(([cat, cents]) => {
              const pct = totalGastos ? Math.round((cents / totalGastos) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat}</span>
                    <span className="text-white/70">
                      {formatCents(cents)} <span className="text-white/40">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded bg-white/10 overflow-hidden">
                    <div className="h-full bg-yellow-500/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
