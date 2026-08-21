"use client";

import { formatCents } from "@/lib/money";

export type StatPoint = {
  label: string; // etiqueta del eje X (fecha o mes)
  ingresosCents: number;
  gastosCents: number; // egresos comunes
  retirosCents: number; // retiros Nahuel-Nelsi-Miguel
  dolar?: number | null; // dólar blue promedio del mes (eje derecho)
};

const GREEN = "#4fd41f";
const RED = "#ef4444";
const YELLOW = "#eab308";
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

// Gráfico de líneas: ingresos (verde), gastos (amarillo), retiros (rojo)
// y, en el eje derecho, el dólar blue promedio del mes (azul punteado).
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
  const hasDolar = data.some((d) => typeof d.dolar === "number");
  const m = { top: 20, right: hasDolar ? 58 : 18, bottom: 74, left: 64 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;

  // Escala en pesos, desde 0 hasta el valor más alto
  const vals = data.flatMap((d) => [
    d.ingresosCents / 100,
    d.gastosCents / 100,
    d.retirosCents / 100,
  ]);
  const maxY = niceCeil(Math.max(1, ...vals));
  const minY = 0;

  const n = data.length;
  const x = (i: number) => (n === 1 ? m.left + plotW / 2 : m.left + (plotW * i) / (n - 1));
  const y = (pesos: number) => m.top + plotH * (1 - (pesos - minY) / (maxY - minY));

  const line = (getter: (d: StatPoint) => number) =>
    data.map((d, i) => `${x(i)},${y(getter(d) / 100)}`).join(" ");

  // Eje derecho: dólar blue (pesos por dólar), escala propia
  const dolarVals = data.map((d) => d.dolar).filter((v): v is number => typeof v === "number");
  const dMax = hasDolar ? niceCeil(Math.max(...dolarVals) * 1.05) : 1;
  const dMin = hasDolar ? Math.floor((Math.min(...dolarVals) * 0.9) / 100) * 100 : 0;
  const yD = (v: number) => m.top + plotH * (1 - (v - dMin) / (dMax - dMin));
  const dolarLine = data
    .map((d, i) => (typeof d.dolar === "number" ? `${x(i)},${yD(d.dolar)}` : null))
    .filter(Boolean)
    .join(" ");
  const dolarGrid = hasDolar
    ? [0, 1, 2, 3, 4].map((k) => {
        const val = dMin + ((dMax - dMin) * k) / 4;
        return { val, yy: yD(val) };
      })
    : [];

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

        {/* Eje derecho: dólar blue */}
        {dolarGrid.map((g, i) => (
          <text key={"d" + i} x={W - m.right + 8} y={g.yy + 4} textAnchor="start" fontSize={11} fill="#3b82f6cc">
            ${Math.round(g.val).toLocaleString("es-AR")}
          </text>
        ))}
        {hasDolar && (
          <polyline fill="none" stroke={BLUE} strokeWidth={2.5} strokeDasharray="6 3" points={dolarLine} />
        )}

        {/* Líneas */}
        <polyline fill="none" stroke={GREEN} strokeWidth={2.5} points={line((d) => d.ingresosCents)} />
        <polyline fill="none" stroke={YELLOW} strokeWidth={2.5} points={line((d) => d.gastosCents)} />
        <polyline fill="none" stroke={RED} strokeWidth={2.5} points={line((d) => d.retirosCents)} />

        {/* Puntos + tooltip nativo + etiquetas del eje X */}
        {data.map((d, i) => {
          const tip =
            `${d.label} · Ingresos: ${formatCents(d.ingresosCents)} · Gastos: ${formatCents(d.gastosCents)} · Retiros: ${formatCents(d.retirosCents)}` +
            (typeof d.dolar === "number" ? ` · Dólar blue: $${d.dolar.toLocaleString("es-AR")}` : "");
          return (
            <g key={d.label + i}>
              <circle cx={x(i)} cy={y(d.ingresosCents / 100)} r={3.5} fill={GREEN}>
                <title>{tip}</title>
              </circle>
              <circle cx={x(i)} cy={y(d.gastosCents / 100)} r={3.5} fill={YELLOW}>
                <title>{tip}</title>
              </circle>
              <circle cx={x(i)} cy={y(d.retirosCents / 100)} r={3.5} fill={RED}>
                <title>{tip}</title>
              </circle>
              {typeof d.dolar === "number" && (
                <circle cx={x(i)} cy={yD(d.dolar)} r={3.5} fill={BLUE}>
                  <title>{tip}</title>
                </circle>
              )}
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
