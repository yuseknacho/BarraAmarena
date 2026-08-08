"use server";

import { db, sqlite, products, categories, stockMovements } from "@/db";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pesosToCents } from "@/lib/money";
import { z } from "zod";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Guarda la foto subida y devuelve el nombre de archivo (o null si no vino).
async function saveImage(value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 5 * 1024 * 1024)
    throw new Error("La imagen no puede superar los 5 MB.");
  const ext = IMAGE_EXT[value.type];
  if (!ext) throw new Error("Formato de imagen no soportado (usá JPG, PNG o WebP).");
  const name = crypto.randomBytes(8).toString("hex") + ext;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, name), Buffer.from(await value.arrayBuffer()));
  return name;
}

function deleteImage(name: string | null) {
  if (!name) return;
  try {
    fs.unlinkSync(path.join(UPLOADS_DIR, name));
  } catch {
    // si no existe, no pasa nada
  }
}

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

  let image: string | null;
  try {
    image = await saveImage(formData.get("image"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar la imagen." };
  }

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
        image,
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

  let image = existing.image;
  try {
    const uploaded = await saveImage(formData.get("image"));
    if (uploaded) {
      deleteImage(existing.image);
      image = uploaded;
    } else if (formData.get("removeImage") === "on") {
      deleteImage(existing.image);
      image = null;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar la imagen." };
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
      image,
      active: formData.get("active") === "on",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, id))
    .run();

  revalidatePath("/productos");
  revalidatePath("/pos");
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
