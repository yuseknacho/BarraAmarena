import { requireAdmin } from "@/lib/auth";
import { toRange, todayLocal, getSalesList } from "@/lib/reports";
import { PageTitle, Card, Th, Td, Badge, Button } from "@/components/ui";
import { formatCents, formatDate } from "@/lib/money";
import Link from "next/link";
import { VoidSaleButton } from "./void-button";

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const today = todayLocal();
  const from = params.from || today;
  const to = params.to || today;
  const rows = getSalesList(toRange(from, to));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageTitle>Ventas ({from} → {to})</PageTitle>
        <Link href={`/reportes?from=${from}&to=${to}`} className="text-sm text-brand hover:underline">
          ← Volver a reportes
        </Link>
      </div>

      <Card>
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Desde</label>
            <input type="date" name="from" defaultValue={from}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Hasta</label>
            <input type="date" name="to" defaultValue={to}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm [color-scheme:dark]" />
          </div>
          <Button type="submit" variant="secondary">Aplicar</Button>
        </form>
      </Card>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Ticket</Th>
              <Th>Fecha</Th>
              <Th>Terminal</Th>
              <Th className="text-right">Ítems</Th>
              <Th className="text-right">Total</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-white/40 py-8">
                  Sin ventas en el período.
                </Td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} className={s.status === "voided" ? "opacity-60" : ""}>
                <Td className="font-mono">
                  {String(s.docNumber).padStart(8, "0")}
                </Td>
                <Td className="whitespace-nowrap">{formatDate(s.createdAt)}</Td>
                <Td>{s.terminalName}</Td>
                <Td className="text-right">{s.itemCount}</Td>
                <Td className="text-right font-medium">{formatCents(s.totalCents)}</Td>
                <Td>
                  <Badge color={s.status === "completed" ? "green" : "red"}>
                    {s.status === "completed" ? "completada" : "anulada"}
                  </Badge>
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <a
                    href={`/print/ticket/${s.id}`}
                    target="_blank"
                    className="text-sm text-brand hover:underline mr-3"
                  >
                    Ver ticket
                  </a>
                  {s.status === "completed" && <VoidSaleButton saleId={s.id} />}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
