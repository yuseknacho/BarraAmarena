import { requireAdmin } from "@/lib/auth";
import { db, cashSessions, terminals, users } from "@/db";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { PageTitle, Card, Th, Td, Badge } from "@/components/ui";
import { formatCents, formatDate } from "@/lib/money";

export default async function HistorialCajasPage() {
  await requireAdmin();

  const openedBy = alias(users, "opened_by");
  const closedBy = alias(users, "closed_by");

  const rows = db
    .select({
      id: cashSessions.id,
      terminalName: terminals.name,
      openedAt: cashSessions.openedAt,
      closedAt: cashSessions.closedAt,
      openingAmountCents: cashSessions.openingAmountCents,
      expectedCashCents: cashSessions.expectedCashCents,
      countedCashCents: cashSessions.countedCashCents,
      differenceCents: cashSessions.differenceCents,
      status: cashSessions.status,
      notes: cashSessions.notes,
      openedByName: openedBy.fullName,
      closedByName: closedBy.fullName,
    })
    .from(cashSessions)
    .innerJoin(terminals, eq(cashSessions.terminalId, terminals.id))
    .innerJoin(openedBy, eq(cashSessions.openedByUserId, openedBy.id))
    .leftJoin(closedBy, eq(cashSessions.closedByUserId, closedBy.id))
    .orderBy(desc(cashSessions.id))
    .limit(100)
    .all();

  return (
    <div className="space-y-4">
      <PageTitle>Historial de cajas</PageTitle>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <Th>#</Th>
              <Th>Terminal</Th>
              <Th>Apertura</Th>
              <Th>Cierre</Th>
              <Th className="text-right">Inicial</Th>
              <Th className="text-right">Esperado</Th>
              <Th className="text-right">Contado</Th>
              <Th className="text-right">Diferencia</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <Td colSpan={9} className="text-center text-gray-400 py-8">
                  Sin cajas registradas.
                </Td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <Td>{s.id}</Td>
                <Td className="font-medium">{s.terminalName}</Td>
                <Td className="whitespace-nowrap">
                  {formatDate(s.openedAt)}
                  <span className="block text-xs text-gray-400">{s.openedByName}</span>
                </Td>
                <Td className="whitespace-nowrap">
                  {s.closedAt ? (
                    <>
                      {formatDate(s.closedAt)}
                      <span className="block text-xs text-gray-400">{s.closedByName}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="text-right">{formatCents(s.openingAmountCents)}</Td>
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
                          ? "text-green-700"
                          : s.differenceCents < 0
                            ? "text-red-600 font-semibold"
                            : "text-yellow-700 font-semibold"
                      }
                    >
                      {formatCents(s.differenceCents)}
                    </span>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <Badge color={s.status === "open" ? "green" : "gray"}>
                    {s.status === "open" ? "abierta" : "cerrada"}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
