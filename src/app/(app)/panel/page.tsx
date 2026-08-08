import { requireSuperAdmin } from "@/lib/auth";
import { toRange, todayLocal, getByPaymentMethod, getSummary } from "@/lib/reports";
import { getTerminalPanels, getClosedSessions } from "@/lib/panel";
import { PageTitle, Card, Th, Td, Badge, Button, PageHelp } from "@/components/ui";
import { formatCents, formatDate } from "@/lib/money";
import { AutoRefresh } from "./auto-refresh";
import Link from "next/link";

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireSuperAdmin();
  const params = await searchParams;
  const today = todayLocal();
  const from = params.from || today;
  const to = params.to || today;
  const range = toRange(from, to);

  const summary = getSummary(range);
  const byMethod = getByPaymentMethod(range);
  const panels = getTerminalPanels(range);
  const closedSessions = getClosedSessions(range);

  const profitCents = summary.totalCents - summary.costCents;
  const cashInDrawers = panels.reduce(
    (a, p) => a + (p.session?.expectedCashCents ?? 0),
    0
  );
  const openCount = panels.filter((p) => p.session).length;

  return (
    <div className="space-y-4">
      <AutoRefresh seconds={30} />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageTitle>Panel de control</PageTitle>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/40">
            Se actualiza solo cada 30 segundos
          </span>
          <Link href={`/reportes?from=${from}&to=${to}`} className="text-brand hover:underline">
            Reportes completos →
          </Link>
        </div>
      </div>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">Desde</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Hasta</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]"
            />
          </div>
          <Button type="submit" variant="secondary">Aplicar</Button>
        </form>
      </Card>

      {/* Resumen global */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-white/50 uppercase">Recaudado</p>
          <p className="text-2xl font-bold">{formatCents(summary.totalCents)}</p>
          <p className="text-xs text-white/40">{summary.count} ventas</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Ganancia</p>
          <p className="text-2xl font-bold text-brand-light">
            {formatCents(profitCents)}
          </p>
          <p className="text-xs text-white/40">
            descuentos: {formatCents(summary.discountCents)}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Efectivo en cajas</p>
          <p className="text-2xl font-bold">{formatCents(cashInDrawers)}</p>
          <p className="text-xs text-white/40">suma de cajas abiertas ahora</p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Cajas operando</p>
          <p className="text-2xl font-bold">
            {openCount} <span className="text-white/40 text-lg">/ {panels.length}</span>
          </p>
          <p className="text-xs text-white/40">abiertas / activas</p>
        </Card>
      </div>

      {/* Control por caja */}
      <h2 className="font-display text-lg tracking-wide uppercase pt-2">
        Control por caja
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {panels.length === 0 && (
          <Card className="text-white/40">
            No hay terminales activas. Creá cajas en Administración → Terminales.
          </Card>
        )}
        {panels.map((p) => (
          <Card key={p.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg tracking-wide uppercase">
                {p.name}
              </h3>
              {p.session ? (
                <Badge color="green">VENDIENDO</Badge>
              ) : (
                <Badge color="gray">caja cerrada</Badge>
              )}
            </div>

            {p.session && (
              <div className="text-xs text-white/50 -mt-2">
                Abierta {formatDate(p.session.openedAt)} · {p.session.openedBy} ·
                inicial {formatCents(p.session.openingAmountCents)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-white/50 uppercase">Recaudado</p>
                <p className="text-xl font-bold">{formatCents(p.totalCents)}</p>
                <p className="text-xs text-white/40">{p.salesCount} ventas</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-xs text-white/50 uppercase">Ganancia</p>
                <p className="text-xl font-bold text-brand-light">
                  {formatCents(p.profitCents)}
                </p>
                {p.voidedCount > 0 && (
                  <p className="text-xs text-yellow-400">
                    {p.voidedCount} anulada{p.voidedCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="text-sm space-y-1">
              {p.byMethod.length === 0 && (
                <p className="text-white/30 text-sm">Sin ventas en el período.</p>
              )}
              {p.byMethod.map((m) => (
                <div key={m.method} className="flex justify-between">
                  <span className="text-white/60">{methodLabels[m.method]}</span>
                  <span className="font-medium">{formatCents(m.totalCents)}</span>
                </div>
              ))}
            </div>

            {p.session && (
              <div className="border-t border-white/10 pt-2 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/60">Efectivo esperado en caja</span>
                  <span className="font-bold text-brand-light">
                    {formatCents(p.session.expectedCashCents)}
                  </span>
                </div>
                {(p.session.ingresosCents > 0 || p.session.egresosCents > 0) && (
                  <div className="flex justify-between text-xs text-white/40">
                    <span>Movimientos manuales</span>
                    <span>
                      +{formatCents(p.session.ingresosCents)} / −
                      {formatCents(p.session.egresosCents)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Contabilidad global por medio de pago + arqueos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-0 overflow-x-auto">
          <div className="px-4 pt-4 pb-2 font-semibold">
            Contabilidad por medio de pago
          </div>
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
          <div className="px-4 pt-4 pb-2 font-semibold">
            Arqueos del período (cierres de caja)
          </div>
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <Th>Caja</Th>
                <Th>Cierre</Th>
                <Th className="text-right">Esperado</Th>
                <Th className="text-right">Contado</Th>
                <Th className="text-right">Diferencia</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {closedSessions.length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-center text-white/40 py-6">
                    Sin cierres en el período.
                  </Td>
                </tr>
              )}
              {closedSessions.map((s) => (
                <tr key={s.id}>
                  <Td className="font-medium">{s.terminalName}</Td>
                  <Td className="whitespace-nowrap">
                    {s.closedAt ? formatDate(s.closedAt) : "—"}
                  </Td>
                  <Td className="text-right">
                    {s.expectedCashCents != null ? formatCents(s.expectedCashCents) : "—"}
                  </Td>
                  <Td className="text-right">
                    {s.countedCashCents != null ? formatCents(s.countedCashCents) : "—"}
                  </Td>
                  <Td className="text-right">
                    {s.differenceCents != null ? (
                      <span
                        className={
                          s.differenceCents === 0
                            ? "text-brand-light"
                            : s.differenceCents < 0
                              ? "text-red-400 font-semibold"
                              : "text-yellow-400 font-semibold"
                        }
                      >
                        {formatCents(s.differenceCents)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <PageHelp>Acá ves en vivo cuánto se recaudó, la ganancia y el estado de cada caja: quién está vendiendo, cuánto efectivo debería haber y cómo cerraron los arqueos. Se actualiza solo cada 30 segundos.</PageHelp>
    </div>
  );
}
