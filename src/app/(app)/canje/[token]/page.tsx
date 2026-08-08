import { requireUser } from "@/lib/auth";
import { db, sqlite, sales, saleItems, users, terminals } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { formatDate } from "@/lib/money";

function fmtQty(qty: number): string {
  return Number.isInteger(qty)
    ? qty.toString()
    : qty.toFixed(3).replace(/\.?0+$/, "");
}

export default async function CanjeTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const user = await requireUser();
  if (user.role === "cajero") redirect("/pos");
  const { token } = await params;

  const sale = db
    .select()
    .from(sales)
    .where(eq(sales.redemptionToken, token))
    .get();

  if (!sale) {
    return (
      <Shell>
        <Card className="text-center py-10 border-red-500/40 bg-red-500/10">
          <p className="text-5xl mb-3">❌</p>
          <h1 className="font-display text-2xl uppercase tracking-wide text-red-300">
            Código inválido
          </h1>
          <p className="text-white/60 mt-2">
            Este QR no corresponde a ningún ticket.
          </p>
        </Card>
      </Shell>
    );
  }

  const items = db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, sale.id))
    .all();
  const terminal = db
    .select({ name: terminals.name })
    .from(terminals)
    .where(eq(terminals.id, sale.terminalId))
    .get();

  if (sale.status === "voided") {
    return (
      <Shell>
        <Card className="text-center py-10 border-red-500/40 bg-red-500/10">
          <p className="text-5xl mb-3">🚫</p>
          <h1 className="font-display text-2xl uppercase tracking-wide text-red-300">
            Venta anulada
          </h1>
          <p className="text-white/60 mt-2">
            Ticket N° {String(sale.docNumber).padStart(8, "0")} — no entregar.
          </p>
        </Card>
      </Shell>
    );
  }

  // Canje atómico: solo el primer escaneo marca la entrega.
  const result = sqlite
    .prepare(
      "UPDATE sales SET redeemed_at = ?, redeemed_by_user_id = ? WHERE id = ? AND redeemed_at IS NULL"
    )
    .run(new Date().toISOString(), user.userId, sale.id);
  const isFirstScan = result.changes === 1;

  const current = db.select().from(sales).where(eq(sales.id, sale.id)).get()!;
  const redeemedBy = current.redeemedByUserId
    ? db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, current.redeemedByUserId))
        .get()
    : null;

  return (
    <Shell>
      {isFirstScan ? (
        <Card className="border-brand/60 bg-brand/10 text-center py-6">
          <p className="text-6xl mb-2">✅</p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-brand-light">
            Válido — Entregar
          </h1>
          <p className="text-white/60 mt-1">
            Ticket N° {String(sale.docNumber).padStart(8, "0")} · {terminal?.name} ·{" "}
            {formatDate(sale.createdAt)}
          </p>
        </Card>
      ) : (
        <Card className="border-yellow-500/50 bg-yellow-500/10 text-center py-6">
          <p className="text-6xl mb-2">⚠️</p>
          <h1 className="font-display text-3xl uppercase tracking-wide text-yellow-400">
            Ya utilizado
          </h1>
          <p className="text-white/70 mt-2 font-semibold">
            Entregado el {current.redeemedAt ? formatDate(current.redeemedAt) : "—"}
            {redeemedBy ? ` por ${redeemedBy.fullName}` : ""}
          </p>
          <p className="text-white/50 text-sm mt-1">
            Ticket N° {String(sale.docNumber).padStart(8, "0")} — no volver a entregar.
          </p>
        </Card>
      )}

      <Card className="p-0">
        <div className="px-4 pt-4 pb-2 font-semibold border-b border-white/10">
          Productos del pedido
        </div>
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`font-display text-2xl w-14 text-center rounded-md py-1 ${
                  isFirstScan
                    ? "bg-brand/20 text-brand-light"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {fmtQty(item.qty)}
              </span>
              <span className="text-lg">{item.description}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="text-center">
        <Link href="/canje">
          <Button variant="secondary">← Volver a entregas</Button>
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-lg mx-auto space-y-4 pt-4">{children}</div>;
}
