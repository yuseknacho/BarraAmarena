"use client";

import { formatCents } from "@/lib/money";

export type StatPoint = {
  label: string; // etiqueta del eje X (fecha o mes)
  ingresosCents: number;
  egresosCents: number;
  saldoCents: number; // saldo acumulado al cierre del punto
};

const GREEN = "#4fd41f";
const RED = "#ef4444";
const BLUE = "#3b82f6";

// Redondea hacia arriba a un número "lindo" (1/2/5 × 10^k) para el eje Y
function niceCeil(v: number): number {
  if (v <= 0) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const frac = v / pow;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * pow;
}

const fmtAxis = (pesos: number) =>
  pesos >= 1_000_000
    ? `${(pesos / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`
    : pesos >= 1000
      ? `${(pesos / 1000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}k`
      : pesos.toLocaleString("es-AR");

// Gráfico de líneas: ingresos (verde), egresos (rojo) y saldo acumulado (azul).
export function StatsChart({ data }: { data: StatPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-white/40 text-center py-12 border border-white/10 rounded-xl">
        No hay movimientos registrados en este período.
      </p>
    );
  }

  const W = 820;
  const H = 380;
  const m = { top: 20, right: 18, bottom: 74, left: 64 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;

  // Escala en pesos. El saldo puede ser negativo: el eje cubre de minY a maxY.
  const vals = data.flatMap((d) => [
    d.ingresosCents / 100,
    d.egresosCents / 100,
    d.saldoCents / 100,
  ]);
  const rawMax = Math.max(1, ...vals);
  const rawMin = Math.min(0, ...vals);
  const maxY = niceCeil(rawMax);
  const minY = rawMin < 0 ? -niceCeil(-rawMin) : 0;

  const n = data.length;
  const x = (i: number) => (n === 1 ? m.left + plotW / 2 : m.left + (plotW * i) / (n - 1));
  const y = (pesos: number) => m.top + plotH * (1 - (pesos - minY) / (maxY - minY));

  const line = (getter: (d: StatPoint) => number) =>
    data.map((d, i) => `${x(i)},${y(getter(d) / 100)}`).join(" ");

  const grid = [0, 1, 2, 3, 4].map((k) => {
    const val = minY + ((maxY - minY) * k) / 4;
    return { val, yy: y(val) };
  });

  // Si hay muchos puntos, mostramos una etiqueta cada N para que no se amontonen
  const step = Math.max(1, Math.ceil(n / 16));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto min-w-[560px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grilla + valores del eje Y */}
        {grid.map((g, i) => (
          <g key={i}>
            <line
              x1={m.left}
              x2={W - m.right}
              y1={g.yy}
              y2={g.yy}
              stroke="#ffffff"
              strokeOpacity={g.val === 0 ? 0.3 : 0.1}
            />
            <text x={m.left - 8} y={g.yy + 4} textAnchor="end" fontSize={11} fill="#ffffff80">
              {fmtAxis(g.val)}
            </text>
          </g>
        ))}

        {/* Líneas */}
        <polyline fill="none" stroke={BLUE} strokeWidth={2.5} points={line((d) => d.saldoCents)} />
        <polyline fill="none" stroke={GREEN} strokeWidth={2.5} points={line((d) => d.ingresosCents)} />
        <polyline fill="none" stroke={RED} strokeWidth={2.5} points={line((d) => d.egresosCents)} />

        {/* Puntos + tooltip nativo + etiquetas del eje X */}
        {data.map((d, i) => {
          const tip = `${d.label} · Ingresos: ${formatCents(d.ingresosCents)} · Egresos: ${formatCents(d.egresosCents)} · Saldo: ${formatCents(d.saldoCents)}`;
          return (
            <g key={d.label + i}>
              <circle cx={x(i)} cy={y(d.saldoCents / 100)} r={3.5} fill={BLUE}>
                <title>{tip}</title>
              </circle>
              <circle cx={x(i)} cy={y(d.ingresosCents / 100)} r={3.5} fill={GREEN}>
                <title>{tip}</title>
              </circle>
              <circle cx={x(i)} cy={y(d.egresosCents / 100)} r={3.5} fill={RED}>
                <title>{tip}</title>
              </circle>
              {i % step === 0 && (
                <text
                  x={x(i)}
                  y={H - m.bottom + 16}
                  textAnchor="end"
                  fontSize={10}
                  fill="#ffffff80"
                  transform={`rotate(-45 ${x(i)} ${H - m.bottom + 16})`}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
