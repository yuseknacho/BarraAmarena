import { requireAdmin } from "@/lib/auth";
import {
  toRange,
  todayLocal,
  getSummary,
  getByPaymentMethod,
  getByTerminal,
  getByCategory,
  getTopProducts,
  getStockValuation,
} from "@/lib/reports";
import { PageTitle, Card, Th, Td, Button } from "@/components/ui";
import { formatCents } from "@/lib/money";
import Link from "next/link";

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const today = todayLocal();
  const from = params.from || today;
  const to = params.to || today;
  const range = toRange(from, to);

  const summary = getSummary(range);
  const byMethod = getByPaymentMethod(range);
  const byTerminal = getByTerminal(range);
  const byCategory = getByCategory(range);
  const topProducts = getTopProducts(range);
  const valuation = getStockValuation();
  const profitCents = summary.totalCents - summary.costCents;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageTitle>Reportes</PageTitle>
        <div className="flex gap-3 text-sm items-center">
          <Link
            href={`/reportes/ventas?from=${from}&to=${to}`}
            className="text-brand hover:underline"
          >
            Ver ventas una por una →
          </Link>
          <a
            href={`/api/export/ventas?from=${from}&to=${to}`}
            className="text-brand hover:underline"
          >
            Exportar CSV ↓
          </a>
        </div>
      </div>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Desde
            </label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Hasta
            </label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>
          <Button type="submit" variant="secondary">
            Aplicar
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-white/50 uppercase">Ventas</p>
          <p className="text-2xl font-bold">{formatCents(summary.totalCents)}</p>
          <p className="text-xs text-white/40">{summary.count} operaciones</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Ganancia</p>
          <p className="text-2xl font-bold text-brand-light">
            {formatCents(profitCents)}
          </p>
          <p className="text-xs text-white/40">venta − costo</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Descuentos</p>
          <p className="text-2xl font-bold">{formatCents(summary.discountCents)}</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Stock valorizado</p>
          <p className="text-2xl font-bold">
            {formatCents(valuation.costValueCents)}
          </p>
          <p className="text-xs text-white/40">
            a precio de venta: {formatCents(valuation.saleValueCents)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">Por medio de pago</div>
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <Th>Medio</Th>
                <Th className="text-right">Ventas</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {byMethod.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-white/40 py-6">
                    Sin ventas en el período.
                  </Td>
                </tr>
              )}
              {byMethod.map((m) => (
                <tr key={m.method}>
                  <Td>{methodLabels[m.method]}</Td>
                  <Td className="text-right">{m.count}</Td>
                  <Td className="text-right font-medium">
                    {formatCents(m.totalCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">Por terminal</div>
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <Th>Terminal</Th>
                <Th className="text-right">Ventas</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Ganancia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {byTerminal.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-white/40 py-6">
                    Sin ventas en el período.
                  </Td>
                </tr>
              )}
              {byTerminal.map((t) => (
                <tr key={t.terminalName}>
                  <Td>{t.terminalName}</Td>
                  <Td className="text-right">{t.count}</Td>
                  <Td className="text-right font-medium">
                    {formatCents(t.totalCents)}
                  </Td>
                  <Td className="text-right text-brand-light">
                    {formatCents(t.profitCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">Por categoría</div>
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <Th>Categoría</Th>
                <Th className="text-right">Cantidad</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {byCategory.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-white/40 py-6">
                    Sin ventas en el período.
                  </Td>
                </tr>
              )}
              {byCategory.map((c) => (
                <tr key={c.categoryName}>
                  <Td>{c.categoryName}</Td>
                  <Td className="text-right">{c.qty}</Td>
                  <Td className="text-right font-medium">
                    {formatCents(c.totalCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">
            Productos más vendidos
          </div>
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <Th>Producto</Th>
                <Th className="text-right">Cantidad</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Ganancia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {topProducts.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-white/40 py-6">
                    Sin ventas en el período.
                  </Td>
                </tr>
              )}
              {topProducts.map((p) => (
                <tr key={p.description}>
                  <Td>{p.description}</Td>
                  <Td className="text-right">{p.qty}</Td>
                  <Td className="text-right font-medium">
                    {formatCents(p.totalCents)}
                  </Td>
                  <Td className="text-right text-brand-light">
                    {formatCents(p.profitCents)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
