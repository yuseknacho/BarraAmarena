import { requireSeller } from "@/lib/auth";
import { getTerminal } from "@/lib/terminal";
import { getOpenSession } from "@/lib/cash";
import { db, products, categories, productComponents } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, PageTitle, Button } from "@/components/ui";
import { PosScreen } from "@/components/pos/pos-screen";

export default async function PosPage() {
  const user = await requireSeller();
  const terminal = await getTerminal();
  if (!terminal) redirect("/setup-terminal");

  const session = getOpenSession(terminal.id);
  if (!session) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <PageTitle>Vender — {terminal.name}</PageTitle>
        <Card className="text-center py-8">
          <p className="text-white/70 mb-4">
            La caja está cerrada. Abrila para empezar a vender.
          </p>
          <Link href="/caja">
            <Button>Abrir caja →</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const productList = db
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      priceCents: products.priceCents,
      stock: products.stock,
      unit: products.unit,
      image: products.image,
      categoryId: products.categoryId,
      isCombo: products.isCombo,
      sortOrder: products.sortOrder,
    })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(products.name)
    .all();

  // Orden manual definido por el Super Admin (los sin posición van al final)
  productList.sort(
    (a, b) =>
      (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
  );

  // Stock efectivo de los combos: cuántas unidades alcanzan los componentes
  const allComponents = db
    .select({
      productId: productComponents.productId,
      qty: productComponents.qty,
      componentStock: products.stock,
    })
    .from(productComponents)
    .innerJoin(products, eq(productComponents.componentProductId, products.id))
    .all();
  for (const p of productList) {
    if (!p.isCombo) continue;
    const comps = allComponents.filter((c) => c.productId === p.id);
    p.stock =
      comps.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(...comps.map((c) => Math.floor(c.componentStock / c.qty)))
          );
  }

  const categoryList = db
    .select()
    .from(categories)
    .orderBy(categories.name)
    .all();

  return (
    <PosScreen
      terminalName={terminal.name}
      sellerName={user.fullName}
      isAdmin={user.role === "superadmin"}
      products={productList}
      categories={categoryList}
    />
  );
}
