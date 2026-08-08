"use server";

import {
  db,
  sqlite,
  products,
  purchases,
  purchaseItems,
  stockMovements,
} from "@/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const purchaseSchema = z.object({
  supplierId: z.number().int().positive("Elegí un proveedor."),
  invoiceRef: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().positive(),
        unitCostCents: z.number().int().min(0),
      })
    )
    .min(1, "La compra no tiene productos."),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type CreatePurchaseResult =
  | { ok: true; purchaseId: number }
  | { ok: false; error: string };

// Registra la compra: sube stock y actualiza el costo del producto (último costo).
export async function createPurchase(
  input: PurchaseInput
): Promise<CreatePurchaseResult> {
  const user = await requireAdmin();
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const result = sqlite.transaction(() => {
      const total = data.items.reduce(
        (a, i) => a + Math.round(i.unitCostCents * i.qty),
        0
      );

      const purchase = db
        .insert(purchases)
        .values({
          supplierId: data.supplierId,
          userId: user.userId,
          invoiceRef: data.invoiceRef || null,
          notes: data.notes || null,
          totalCents: total,
        })
        .returning({ id: purchases.id })
        .get();

      for (const item of data.items) {
        const p = db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .get();
        if (!p) throw new Error("Producto inexistente.");

        const newStock = p.stock + item.qty;

        db.insert(purchaseItems)
          .values({
            purchaseId: purchase.id,
            productId: item.productId,
            qty: item.qty,
            unitCostCents: item.unitCostCents,
            lineTotalCents: Math.round(item.unitCostCents * item.qty),
          })
          .run();

        db.update(products)
          .set({
            stock: newStock,
            costCents: item.unitCostCents,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(products.id, item.productId))
          .run();

        db.insert(stockMovements)
          .values({
            productId: item.productId,
            type: "compra",
            qtyDelta: item.qty,
            stockAfter: newStock,
            refTable: "purchases",
            refId: purchase.id,
            userId: user.userId,
          })
          .run();
      }

      return { purchaseId: purchase.id };
    })();

    revalidatePath("/compras");
    revalidatePath("/productos");
    revalidatePath("/inventario");
    return { ok: true, ...result };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al registrar la compra.",
    };
  }
}
