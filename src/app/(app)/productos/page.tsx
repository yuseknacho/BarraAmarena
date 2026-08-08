import { requireAdmin } from "@/lib/auth";
import { db, products, categories } from "@/db";
import { like, or, desc } from "drizzle-orm";
import { PageTitle } from "@/components/ui";
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
          or(like(products.name, `%${query}%`), like(products.barcode, `%${query}%`))
        )
        .orderBy(products.name)
        .all()
    : db.select().from(products).orderBy(desc(products.createdAt)).limit(200).all();

  return (
    <div>
      <PageTitle>Productos</PageTitle>
      <ProductManager
        products={rows}
        categories={allCategories}
        initialQuery={query ?? ""}
      />
    </div>
  );
}
