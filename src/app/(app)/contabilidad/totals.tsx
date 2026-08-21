"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { formatCents } from "@/lib/money";

interface Mov {
  date: string;
  type: "ingreso" | "egreso";
  amountCents: number;
}

const selectCls =
  "bg-neutral-900 border border-white/10 p-2 rounded text-white focus:border-brand outline-none";

// Totales de ingresos / egresos / saldo con filtro por año ("" = todos).
export function LedgerTotals({ entries }: { entries: Mov[] }) {
  const [year, setYear] = useState("");

  const years = useMemo(
    () =>
      [...new Set(entries.map((e) => e.date.slice(0, 4)))].sort((a, b) =>
        b.localeCompare(a)
      ),
    [entries]
  );

  const { ingresos, egresos } = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    for (const e of entries) {
      if (year && e.date.slice(0, 4) !== year) continue;
      if (e.type === "ingreso") ingresos += e.amountCents;
      else egresos += e.amountCents;
    }
    return { ingresos, egresos };
  }, [entries, year]);

  const saldo = ingresos - egresos;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-white/60">Filtro · Año:</label>
        <select className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Todos</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-white/50 uppercase">Ingresos{year && ` ${year}`}</p>
          <p className="text-lg font-bold text-brand-light">{formatCents(ingresos)}</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Egresos{year && ` ${year}`}</p>
          <p className="text-lg font-bold text-red-400">{formatCents(egresos)}</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Saldo{year && ` ${year}`}</p>
          <p className={`text-lg font-bold ${saldo >= 0 ? "text-brand-light" : "text-red-400"}`}>
            {formatCents(saldo)}
          </p>
        </Card>
      </div>
    </div>
  );
}
