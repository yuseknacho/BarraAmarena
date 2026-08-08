"use server";

import { db, sqlite, products, categories, stockMovements } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pesosToCents } from "@/lib/money";
import { z } from "zod";

export type ActionResult = { error?: string; ok?: boolean };

const productSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido"),
  barcode: z.string().trim().optional(),
  categoryId: z.coerce.number().optional(),
  cost: z.coerce.number().min(0, "Costo inválido"),
  price: z.coerce.number().min(0, "Precio inválido"),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  minStock: z.coerce.number().min(0).optional(),
  unit: z.string().trim().min(1),
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    barcode: String(formData.get("barcode") ?? "").trim() || undefined,
    categoryId: formData.get("categoryId") || undefined,
    cost: formData.get("cost") || 0,
    price: formData.get("price") || 0,
    taxRate: formData.get("taxRate") || undefined,
    minStock: formData.get("minStock") || undefined,
    unit: formData.get("unit") || "u",
  });
}

export async function createProduct(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.barcode) {
    const dup = db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.barcode, d.barcode))
      .get();
    if (dup) return { error: "Ya existe un producto con ese código de barras." };
  }

  const initialStock = Number(formData.get("stock") ?? 0) || 0;

  const tx = sqlite.transaction(() => {
    const inserted = db
      .insert(products)
      .values({
        name: d.name,
        barcode: d.barcode ?? null,
        categoryId: d.categoryId ?? null,
        costCents: pesosToCents(d.cost),
        priceCents: pesosToCents(d.price),
        taxRate: d.taxRate ?? null,
        minStock: d.minStock ?? null,
        unit: d.unit,
        stock: initialStock,
      })
      .returning({ id: products.id })
      .get();

    if (initialStock !== 0) {
      db.insert(stockMovements)
        .values({
          productId: inserted.id,
          type: "ajuste",
          qtyDelta: initialStock,
          stockAfter: initialStock,
          userId: user.userId,
          reason: "Stock inicial",
        })
        .run();
    }
  });
  tx();

  revalidatePath("/productos");
  return { ok: true };
}

export async function updateProduct(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const existing = db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) return { error: "Producto no encontrado." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.barcode) {
    const dup = db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.barcode, d.barcode), ne(products.id, id)))
      .get();
    if (dup) return { error: "Otro producto ya usa ese código de barras." };
  }

  db.update(products)
    .set({
      name: d.name,
      barcode: d.barcode ?? null,
      categoryId: d.categoryId ?? null,
      costCents: pesosToCents(d.cost),
      priceCents: pesosToCents(d.price),
      taxRate: d.taxRate ?? null,
      minStock: d.minStock ?? null,
      unit: d.unit,
      active: formData.get("active") === "on",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, id))
    .run();

  revalidatePath("/productos");
  return { ok: true };
}

export async function createCategory(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nombre requerido." };
  const dup = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .get();
  if (dup) return { error: "Ya existe esa categoría." };
  db.insert(categories).values({ name }).run();
  revalidatePath("/productos");
  return { ok: true };
}

export async function adjustStock(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Solo un administrador puede ajustar stock." };

  const productId = Number(formData.get("productId"));
  const newStock = Number(formData.get("newStock"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!Number.isFinite(newStock) || newStock < 0)
    return { error: "Cantidad inválida." };
  if (!reason) return { error: "Indicá el motivo del ajuste." };

  const product = db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();
  if (!product) return { error: "Producto no encontrado." };

  const delta = newStock - product.stock;
  if (delta === 0) return { error: "El stock ya es ese valor." };

  const tx = sqlite.transaction(() => {
    db.update(products)
      .set({ stock: newStock, updatedAt: new Date().toISOString() })
      .where(eq(products.id, productId))
      .run();
    db.insert(stockMovements)
      .values({
        productId,
        type: "ajuste",
        qtyDelta: delta,
        stockAfter: newStock,
        userId: user.userId,
        reason,
      })
      .run();
  });
  tx();

  revalidatePath("/inventario");
  revalidatePath("/productos");
  return { ok: true };
}
