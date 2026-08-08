import { requireUser } from "@/lib/auth";
import { getTerminal } from "@/lib/terminal";
import {
  computeExpectedCash,
  getOpenSession,
  getSessionSalesTotals,
} from "@/lib/cash";
import { db, cashMovements, users } from "@/db";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageTitle, Card, Th, Td, Badge, Button } from "@/components/ui";
import { formatCents, formatDate } from "@/lib/money";
import { OpenSessionForm, MovementForm, CloseSessionForm } from "./forms";

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export default async function CajaPage() {
  const user = await requireUser();
  const terminal = await getTerminal();
  if (!terminal) redirect("/setup-terminal");

  const session = getOpenSession(terminal.id);

  if (!session) {
    return (
      <div className="max-w-lg">
        <PageTitle>Caja — {terminal.name}</PageTitle>
        <Card>
          <h2 className="font-semibold mb-1">Caja cerrada</h2>
          <p className="text-sm text-white/50 mb-4">
            Abrí la caja para empezar a vender en esta terminal.
          </p>
          <OpenSessionForm />
        </Card>
        {user.role === "superadmin" && (
          <p className="mt-4 text-sm">
            <Link href="/caja/historial" className="text-brand hover:underline">
              Ver historial de cajas →
            </Link>
          </p>
        )}
      </div>
    );
  }

  const expected = computeExpectedCash(session.id);
  const salesTotals = getSessionSalesTotals(session.id);
  const totalSalesCents = salesTotals.reduce((acc, t) => acc + t.total, 0);
  const openedBy = db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, session.openedByUserId))
    .get();

  const movements = db
    .select({
      id: cashMovements.id,
      type: cashMovements.type,
      amountCents: cashMovements.amountCents,
      reason: cashMovements.reason,
      createdAt: cashMovements.createdAt,
      userName: users.fullName,
    })
    .from(cashMovements)
    .innerJoin(users, eq(cashMovements.userId, users.id))
    .where(eq(cashMovements.cashSessionId, session.id))
    .orderBy(desc(cashMovements.id))
    .all();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PageTitle>Caja — {terminal.name}</PageTitle>
        {user.role === "superadmin" && (
          <Link href="/caja/historial" className="text-sm text-brand hover:underline">
            Historial de cajas →
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-white/50 uppercase">Apertura</p>
          <p className="text-lg font-bold">{formatCents(session.openingAmountCents)}</p>
          <p className="text-xs text-white/40">
            {formatDate(session.openedAt)} · {openedBy?.fullName}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Ventas de la sesión</p>
          <p className="text-lg font-bold">{formatCents(totalSalesCents)}</p>
          <div className="text-xs text-white/40 space-x-2">
            {salesTotals.map((t) => (
              <span key={t.method}>
                {methodLabels[t.method]}: {formatCents(t.total)}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs text-white/50 uppercase">Efectivo esperado</p>
          <p className="text-lg font-bold text-brand-light">{formatCents(expected)}</p>
          <p className="text-xs text-white/40">apertura + mov. + ventas efectivo</p>
        </Card>
        <Card className="flex items-center justify-center">
          <Link href="/pos">
            <Button>Ir a vender →</Button>
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-3">Movimiento de efectivo</h2>
          <MovementForm />
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Cerrar caja (arqueo)</h2>
          <CloseSessionForm expectedCents={expected} />
        </Card>
      </div>

      <Card className="p-0 overflow-x-auto">
        <div className="px-4 pt-4 pb-2 font-semibold">Movimientos de la sesión</div>
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Fecha</Th>
              <Th>Tipo</Th>
              <Th className="text-right">Monto</Th>
              <Th>Motivo</Th>
              <Th>Usuario</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {movements.length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center text-white/40 py-6">
                  Sin movimientos manuales.
                </Td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap">{formatDate(m.createdAt)}</Td>
                <Td>
                  <Badge color={m.type === "ingreso" ? "green" : "red"}>
                    {m.type}
                  </Badge>
                </Td>
                <Td className="text-right">
                  {m.type === "egreso" ? "−" : "+"}
                  {formatCents(m.amountCents)}
                </Td>
                <Td>{m.reason}</Td>
                <Td>{m.userName}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
