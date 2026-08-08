import { requireAdmin } from "@/lib/auth";
import { db, products, stockMovements, users } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import { PageTitle, Card, Th, Td, Badge } from "@/components/ui";
import { formatQty, formatDate } from "@/lib/money";
import { AdjustStockForm } from "./adjust-form";

const movementLabels: Record<string, string> = {
  venta: "Venta",
  compra: "Compra",
  ajuste: "Ajuste",
  anulacion: "Anulación",
};

export default async function InventarioPage() {
  await requireAdmin();

  const lowStock = db
    .select()
    .from(products)
    .where(
      sql`${products.minStock} IS NOT NULL AND ${products.stock} <= ${products.minStock} AND ${products.active} = 1`
    )
    .orderBy(products.name)
    .all();

  const activeProducts = db
    .select({ id: products.id, name: products.name, stock: products.stock, unit: products.unit })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name)
    .all();

  const movements = db
    .select({
      id: stockMovements.id,
      productName: products.name,
      unit: products.unit,
      type: stockMovements.type,
      qtyDelta: stockMovements.qtyDelta,
      stockAfter: stockMovements.stockAfter,
      reason: stockMovements.reason,
      userName: users.fullName,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .innerJoin(users, eq(stockMovements.userId, users.id))
    .orderBy(desc(stockMovements.id))
    .limit(50)
    .all();

  return (
    <div className="space-y-4">
      <PageTitle>Inventario</PageTitle>

      {lowStock.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/10">
          <h2 className="font-semibold text-red-300 mb-2">
            ⚠️ Productos con stock bajo ({lowStock.length})
          </h2>
          <ul className="text-sm text-red-300 space-y-1">
            {lowStock.map((p) => (
              <li key={p.id}>
                {p.name}: {formatQty(p.stock, p.unit)} (mínimo{" "}
                {formatQty(p.minStock!, p.unit)})
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AdjustStockForm products={activeProducts} />

      <Card className="p-0 overflow-x-auto">
        <div className="px-4 pt-4 pb-2 font-semibold">
          Últimos movimientos de stock
        </div>
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Fecha</Th>
              <Th>Producto</Th>
              <Th>Tipo</Th>
              <Th className="text-right">Cantidad</Th>
              <Th className="text-right">Stock final</Th>
              <Th>Motivo</Th>
              <Th>Usuario</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {movements.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-white/40 py-8">
                  Sin movimientos todavía.
                </Td>
              </tr>
            )}
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="whitespace-nowrap">{formatDate(m.createdAt)}</Td>
                <Td>{m.productName}</Td>
                <Td>
                  <Badge
                    color={
                      m.type === "venta"
                        ? "blue"
                        : m.type === "compra"
                          ? "green"
                          : m.type === "anulacion"
                            ? "yellow"
                            : "gray"
                    }
                  >
                    {movementLabels[m.type]}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <span className={m.qtyDelta < 0 ? "text-red-400" : "text-brand-light"}>
                    {m.qtyDelta > 0 ? "+" : ""}
                    {formatQty(m.qtyDelta, m.unit)}
                  </span>
                </Td>
                <Td className="text-right">{formatQty(m.stockAfter, m.unit)}</Td>
                <Td className="text-white/50">{m.reason ?? "—"}</Td>
                <Td>{m.userName}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
