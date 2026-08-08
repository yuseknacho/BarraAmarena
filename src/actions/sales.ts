"use server";

import {
  db,
  sqlite,
  products,
  sales,
  saleItems,
  salePayments,
  stockMovements,
  documentCounters,
} from "@/db";
import { eq, like, or, and, sql } from "drizzle-orm";
import { requireUser, requireAdmin } from "@/lib/auth";
import { getTerminal } from "@/lib/terminal";
import { getOpenSession } from "@/lib/cash";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Búsqueda incremental para el POS (solo productos activos).
export async function searchProducts(query: string) {
  await requireUser();
  const q = query.trim();
  if (!q) return [];
  return db
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      priceCents: products.priceCents,
      stock: products.stock,
      unit: products.unit,
    })
    .from(products)
    .where(
      and(
        eq(products.active, true),
        or(like(products.name, `%${q}%`), like(products.barcode, `${q}%`))
      )
    )
    .orderBy(products.name)
    .limit(12)
    .all();
}

export async function findByBarcode(code: string) {
  await requireUser();
  const barcode = code.trim();
  if (!barcode) return null;
  const p = db
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      priceCents: products.priceCents,
      stock: products.stock,
      unit: products.unit,
    })
    .from(products)
    .where(and(eq(products.active, true), eq(products.barcode, barcode)))
    .get();
  return p ?? null;
}

const saleInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().positive(),
        discountCents: z.number().int().min(0).default(0),
      })
    )
    .min(1, "La venta no tiene productos."),
  discountCents: z.number().int().min(0).default(0),
  payments: z
    .array(
      z.object({
        method: z.enum(["efectivo", "tarjeta", "transferencia", "otro"]),
        amountCents: z.number().int().positive(),
        reference: z.string().trim().optional(),
      })
    )
    .min(1, "Falta el medio de pago."),
  customerId: z.number().int().positive().nullable().optional(),
});

export type SaleInput = z.infer<typeof saleInputSchema>;
export type CreateSaleResult =
  | { ok: true; saleId: number; docNumber: number }
  | { ok: false; error: string };

export async function createSale(input: SaleInput): Promise<CreateSaleResult> {
  const user = await requireUser();
  const terminal = await getTerminal();
  if (!terminal)
    return { ok: false, error: "Este dispositivo no tiene terminal vinculada." };

  const session = getOpenSession(terminal.id);
  if (!session)
    return { ok: false, error: "No hay caja abierta. Abrí la caja antes de vender." };

  const parsed = saleInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  try {
    const result = sqlite.transaction(() => {
      // Precios y costos se leen del producto DENTRO de la transacción y se
      // congelan en sale_items: el cliente solo manda ids y cantidades.
      let subtotal = 0;
      let totalCost = 0;
      const lines: {
        productId: number;
        description: string;
        qty: number;
        unitPriceCents: number;
        unitCostCents: number;
        taxRate: number | null;
        discountCents: number;
        lineTotalCents: number;
        newStock: number;
      }[] = [];

      for (const item of data.items) {
        const p = db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .get();
        if (!p || !p.active) throw new Error("Producto inexistente o inactivo.");

        const lineTotal =
          Math.round(p.priceCents * item.qty) - item.discountCents;
        if (lineTotal < 0) throw new Error(`Descuento mayor al total en ${p.name}.`);

        subtotal += Math.round(p.priceCents * item.qty);
        totalCost += Math.round(p.costCents * item.qty);
        lines.push({
          productId: p.id,
          description: p.name,
          qty: item.qty,
          unitPriceCents: p.priceCents,
          unitCostCents: p.costCents,
          taxRate: p.taxRate,
          discountCents: item.discountCents,
          lineTotalCents: lineTotal,
          newStock: p.stock - item.qty,
        });
      }

      const itemDiscounts = lines.reduce((a, l) => a + l.discountCents, 0);
      const total = subtotal - itemDiscounts - data.discountCents;
      if (total < 0) throw new Error("El descuento supera el total.");

      const paid = data.payments.reduce((a, p) => a + p.amountCents, 0);
      if (paid !== total)
        throw new Error("Los pagos no coinciden con el total de la venta.");

      // Número correlativo, dentro de la transacción (sin colisiones).
      const counter = db
        .select()
        .from(documentCounters)
        .where(eq(documentCounters.docType, "ticket"))
        .get()!;
      const docNumber = counter.nextNumber;
      db.update(documentCounters)
        .set({ nextNumber: docNumber + 1 })
        .where(eq(documentCounters.docType, "ticket"))
        .run();

      const sale = db
        .insert(sales)
        .values({
          docType: "ticket",
          docNumber,
          terminalId: terminal.id,
          cashSessionId: session.id,
          userId: user.userId,
          customerId: data.customerId ?? null,
          subtotalCents: subtotal,
          discountCents: itemDiscounts + data.discountCents,
          totalCents: total,
          totalCostCents: totalCost,
        })
        .returning({ id: sales.id })
        .get();

      for (const l of lines) {
        db.insert(saleItems)
          .values({
            saleId: sale.id,
            productId: l.productId,
            description: l.description,
            qty: l.qty,
            unitPriceCents: l.unitPriceCents,
            unitCostCents: l.unitCostCents,
            taxRate: l.taxRate,
            discountCents: l.discountCents,
            lineTotalCents: l.lineTotalCents,
          })
          .run();

        db.update(products)
          .set({ stock: l.newStock, updatedAt: new Date().toISOString() })
          .where(eq(products.id, l.productId))
          .run();

        db.insert(stockMovements)
          .values({
            productId: l.productId,
            type: "venta",
            qtyDelta: -l.qty,
            stockAfter: l.newStock,
            refTable: "sales",
            refId: sale.id,
            userId: user.userId,
          })
          .run();
      }

      for (const p of data.payments) {
        db.insert(salePayments)
          .values({
            saleId: sale.id,
            method: p.method,
            amountCents: p.amountCents,
            reference: p.reference || null,
          })
          .run();
      }

      return { saleId: sale.id, docNumber };
    })();

    revalidatePath("/caja");
    return { ok: true, ...result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al registrar la venta." };
  }
}

// Anula una venta: repone stock y la marca como anulada (solo admin).
export async function voidSale(saleId: number): Promise<{ error?: string; ok?: boolean }> {
  const admin = await requireAdmin();

  try {
    sqlite.transaction(() => {
      const sale = db.select().from(sales).where(eq(sales.id, saleId)).get();
      if (!sale) throw new Error("Venta no encontrada.");
      if (sale.status === "voided") throw new Error("La venta ya está anulada.");

      db.update(sales)
        .set({
          status: "voided",
          voidedAt: new Date().toISOString(),
          voidedByUserId: admin.userId,
        })
        .where(eq(sales.id, saleId))
        .run();

      const items = db
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, saleId))
        .all();

      for (const item of items) {
        if (!item.productId) continue;
        db.update(products)
          .set({
            stock: sql`${products.stock} + ${item.qty}`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(products.id, item.productId))
          .run();
        const updated = db
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, item.productId))
          .get()!;
        db.insert(stockMovements)
          .values({
            productId: item.productId,
            type: "anulacion",
            qtyDelta: item.qty,
            stockAfter: updated.stock,
            refTable: "sales",
            refId: saleId,
            userId: admin.userId,
            reason: `Anulación ticket #${sale.docNumber}`,
          })
          .run();
      }
    })();

    revalidatePath("/reportes");
    revalidatePath("/caja");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al anular." };
  }
}
