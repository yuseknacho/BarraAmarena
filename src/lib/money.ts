// Todo el dinero del sistema se maneja en centavos (enteros).

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

export function pesosToCents(pesos: number | string): number {
  const n = typeof pesos === "string" ? parseFloat(pesos.replace(",", ".")) : pesos;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}

export function formatQty(qty: number, unit: string): string {
  const s = Number.isInteger(qty) ? qty.toString() : qty.toFixed(3).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}
