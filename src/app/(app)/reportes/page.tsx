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
            className="text-blue-600 hover:underline"
          >
            Ver ventas una por una →
          </Link>
          <a
            href={`/api/export/ventas?from=${from}&to=${to}`}
            className="text-blue-600 hover:underline"
          >
            Exportar CSV ↓
          </a>
        </div>
      </div>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" variant="secondary">
            Aplicar
          </Button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-gray-500 uppercase">Ventas</p>
          <p className="text-2xl font-bold">{formatCents(summary.totalCents)}</p>
          <p className="text-xs text-gray-400">{summary.count} operaciones</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase">Ganancia</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCents(profitCents)}
          </p>
          <p className="text-xs text-gray-400">venta − costo</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase">Descuentos</p>
          <p className="text-2xl font-bold">{formatCents(summary.discountCents)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 uppercase">Stock valorizado</p>
          <p className="text-2xl font-bold">
            {formatCents(valuation.costValueCents)}
          </p>
          <p className="text-xs text-gray-400">
            a precio de venta: {formatCents(valuation.saleValueCents)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">Por medio de pago</div>
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <Th>Medio</Th>
                <Th className="text-right">Ventas</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byMethod.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-gray-400 py-6">
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
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <Th>Terminal</Th>
                <Th className="text-right">Ventas</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Ganancia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byTerminal.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-gray-400 py-6">
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
                  <Td className="text-right text-green-700">
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
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <Th>Categoría</Th>
                <Th className="text-right">Cantidad</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byCategory.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-gray-400 py-6">
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
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <Th>Producto</Th>
                <Th className="text-right">Cantidad</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Ganancia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-gray-400 py-6">
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
                  <Td className="text-right text-green-700">
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
