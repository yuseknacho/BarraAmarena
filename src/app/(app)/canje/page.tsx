import { requireUser } from "@/lib/auth";
import { db, sales, users } from "@/db";
import { desc, eq, isNotNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PageTitle, Card, Th, Td, PageHelp } from "@/components/ui";
import { formatDate } from "@/lib/money";
import { TokenForm } from "./token-form";

export default async function CanjePage() {
  const user = await requireUser();
  if (user.role === "cajero") redirect("/pos");

  const recent = db
    .select({
      id: sales.id,
      docNumber: sales.docNumber,
      redeemedAt: sales.redeemedAt,
      redeemedBy: users.fullName,
    })
    .from(sales)
    .innerJoin(users, eq(sales.redeemedByUserId, users.id))
    .where(isNotNull(sales.redeemedAt))
    .orderBy(desc(sales.redeemedAt))
    .limit(15)
    .all();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageTitle>Entrega de pedidos</PageTitle>

      <Card className="text-center py-8 space-y-4">
        <p className="text-5xl">📱</p>
        <h2 className="text-lg font-semibold">
          Escaneá el QR del ticket con la cámara del teléfono
        </h2>
        <p className="text-sm text-white/50 max-w-md mx-auto">
          Cada ticket sale con un código QR al pie. Al escanearlo se abre la
          pantalla con los productos a entregar. También podés escanearlo con
          un lector físico apuntando al campo de abajo.
        </p>
        <TokenForm />
      </Card>

      <Card className="p-0 overflow-x-auto">
        <div className="px-4 pt-4 pb-2 font-semibold">Últimas entregas</div>
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Ticket</Th>
              <Th>Entregado</Th>
              <Th>Por</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {recent.length === 0 && (
              <tr>
                <Td colSpan={3} className="text-center text-white/40 py-6">
                  Todavía no se entregaron pedidos.
                </Td>
              </tr>
            )}
            {recent.map((r) => (
              <tr key={r.id}>
                <Td className="font-mono">{String(r.docNumber).padStart(8, "0")}</Td>
                <Td>{r.redeemedAt ? formatDate(r.redeemedAt) : "—"}</Td>
                <Td>{r.redeemedBy}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <PageHelp>
        El barman escanea el QR que sale impreso en cada ticket: la primera vez
        aparece en verde con los productos a entregar, y si alguien lo vuelve a
        escanear aparece como ya utilizado, con la hora y quién lo entregó.
      </PageHelp>
    </div>
  );
}
