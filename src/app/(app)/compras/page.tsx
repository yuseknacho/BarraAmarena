import { requireAdmin } from "@/lib/auth";
import { db, purchases, purchaseItems, suppliers, users, products } from "@/db";
import { desc, eq } from "drizzle-orm";
import { PageTitle, Card, Th, Td, PageHelp } from "@/components/ui";
import { formatCents, formatDate } from "@/lib/money";
import { PurchaseForm } from "./purchase-form";

export default async function ComprasPage() {
  await requireAdmin();

  const supplierList = db
    .select({ id: suppliers.id, name: suppliers.name })
    .from(suppliers)
    .where(eq(suppliers.active, true))
    .orderBy(suppliers.name)
    .all();

  const productList = db
    .select({
      id: products.id,
      name: products.name,
      costCents: products.costCents,
      stock: products.stock,
      unit: products.unit,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name)
    .all();

  const recent = db
    .select({
      id: purchases.id,
      supplierName: suppliers.name,
      invoiceRef: purchases.invoiceRef,
      totalCents: purchases.totalCents,
      createdAt: purchases.createdAt,
      userName: users.fullName,
      itemCount: db.$count(purchaseItems, eq(purchaseItems.purchaseId, purchases.id)),
    })
    .from(purchases)
    .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .innerJoin(users, eq(purchases.userId, users.id))
    .orderBy(desc(purchases.id))
    .limit(50)
    .all();

  return (
    <div className="space-y-4">
      <PageTitle>Compras a proveedores</PageTitle>
      <PurchaseForm suppliers={supplierList} products={productList} />
      <Card className="p-0 overflow-x-auto">
        <div className="px-4 pt-4 pb-2 font-semibold">Últimas compras</div>
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>#</Th>
              <Th>Fecha</Th>
              <Th>Proveedor</Th>
              <Th>Factura/Remito</Th>
              <Th className="text-right">Ítems</Th>
              <Th className="text-right">Total</Th>
              <Th>Cargó</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {recent.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-white/40 py-8">
                  Sin compras registradas.
                </Td>
              </tr>
            )}
            {recent.map((p) => (
              <tr key={p.id}>
                <Td>{p.id}</Td>
                <Td className="whitespace-nowrap">{formatDate(p.createdAt)}</Td>
                <Td className="font-medium">{p.supplierName}</Td>
                <Td>{p.invoiceRef ?? "—"}</Td>
                <Td className="text-right">{p.itemCount}</Td>
                <Td className="text-right font-medium">{formatCents(p.totalCents)}</Td>
                <Td>{p.userName}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <PageHelp>Registrá acá lo que le comprás a tus proveedores: al confirmar una compra, el stock de los productos sube automáticamente y el costo se actualiza al de esa compra.</PageHelp>
    </div>
  );
}
