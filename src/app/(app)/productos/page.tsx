import { requireAdmin } from "@/lib/auth";
import { db, products, categories, productComponents } from "@/db";
import { like, or, and, desc, isNull } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { ProductManager } from "./product-manager";

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;

  const allCategories = db.select().from(categories).orderBy(categories.name).all();
  const query = q?.trim();
  const rows = query
    ? db
        .select()
        .from(products)
        .where(
          and(
            isNull(products.deletedAt),
            or(
              like(products.name, `%${query}%`),
              like(products.barcode, `%${query}%`)
            )
          )
        )
        .orderBy(products.name)
        .all()
    : db
        .select()
        .from(products)
        .where(isNull(products.deletedAt))
        .orderBy(desc(products.createdAt))
        .limit(200)
        .all();

  const allComponents = db.select().from(productComponents).all();

  return (
    <div>
      <PageTitle>Productos</PageTitle>
      <ProductManager
        products={rows}
        categories={allCategories}
        components={allComponents}
        initialQuery={query ?? ""}
      />
      <PageHelp>El catálogo de todo lo que vendés: nombre, código de barras, categoría, costo, precio de venta, la foto que aparece en la pantalla de vender y el stock mínimo para recibir alertas.</PageHelp>
    </div>
  );
}
