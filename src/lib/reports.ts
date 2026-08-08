import {
  db,
  sales,
  saleItems,
  salePayments,
  products,
  categories,
  terminals,
} from "@/db";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

export interface DateRange {
  fromIso: string;
  toIso: string;
}

// from/to vienen como YYYY-MM-DD (fecha local del servidor = fecha del negocio).
export function toRange(from: string, to: string): DateRange {
  return {
    fromIso: new Date(`${from}T00:00:00`).toISOString(),
    toIso: new Date(`${to}T23:59:59.999`).toISOString(),
  };
}

export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function completedInRange({ fromIso, toIso }: DateRange) {
  return and(
    eq(sales.status, "completed"),
    gte(sales.createdAt, fromIso),
    lte(sales.createdAt, toIso)
  );
}

export function getSummary(range: DateRange) {
  return db
    .select({
      count: sql<number>`COUNT(*)`,
      totalCents: sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`,
      costCents: sql<number>`COALESCE(SUM(${sales.totalCostCents}), 0)`,
      discountCents: sql<number>`COALESCE(SUM(${sales.discountCents}), 0)`,
    })
    .from(sales)
    .where(completedInRange(range))
    .get()!;
}

export function getByPaymentMethod(range: DateRange) {
  return db
    .select({
      method: salePayments.method,
      totalCents: sql<number>`COALESCE(SUM(${salePayments.amountCents}), 0)`,
      count: sql<number>`COUNT(DISTINCT ${sales.id})`,
    })
    .from(salePayments)
    .innerJoin(sales, eq(salePayments.saleId, sales.id))
    .where(completedInRange(range))
    .groupBy(salePayments.method)
    .all();
}

export function getByTerminal(range: DateRange) {
  return db
    .select({
      terminalName: terminals.name,
      count: sql<number>`COUNT(*)`,
      totalCents: sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`,
      profitCents: sql<number>`COALESCE(SUM(${sales.totalCents} - ${sales.totalCostCents}), 0)`,
    })
    .from(sales)
    .innerJoin(terminals, eq(sales.terminalId, terminals.id))
    .where(completedInRange(range))
    .groupBy(sales.terminalId)
    .all();
}

export function getByCategory(range: DateRange) {
  return db
    .select({
      categoryName: sql<string>`COALESCE(${categories.name}, 'Sin categoría')`,
      qty: sql<number>`COALESCE(SUM(${saleItems.qty}), 0)`,
      totalCents: sql<number>`COALESCE(SUM(${saleItems.lineTotalCents}), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .leftJoin(products, eq(saleItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(completedInRange(range))
    .groupBy(sql`COALESCE(${categories.name}, 'Sin categoría')`)
    .orderBy(desc(sql`SUM(${saleItems.lineTotalCents})`))
    .all();
}

export function getTopProducts(range: DateRange, limit = 15) {
  return db
    .select({
      description: saleItems.description,
      qty: sql<number>`COALESCE(SUM(${saleItems.qty}), 0)`,
      totalCents: sql<number>`COALESCE(SUM(${saleItems.lineTotalCents}), 0)`,
      profitCents: sql<number>`COALESCE(SUM(${saleItems.lineTotalCents} - CAST(${saleItems.unitCostCents} * ${saleItems.qty} AS INTEGER)), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(completedInRange(range))
    .groupBy(saleItems.description)
    .orderBy(desc(sql`SUM(${saleItems.qty})`))
    .limit(limit)
    .all();
}

export function getStockValuation() {
  return db
    .select({
      productCount: sql<number>`COUNT(*)`,
      totalUnits: sql<number>`COALESCE(SUM(${products.stock}), 0)`,
      costValueCents: sql<number>`COALESCE(SUM(CAST(${products.stock} * ${products.costCents} AS INTEGER)), 0)`,
      saleValueCents: sql<number>`COALESCE(SUM(CAST(${products.stock} * ${products.priceCents} AS INTEGER)), 0)`,
    })
    .from(products)
    .where(and(eq(products.active, true), sql`${products.stock} > 0`))
    .get()!;
}

export function getSalesList(range: DateRange, limit = 200) {
  return db
    .select({
      id: sales.id,
      docNumber: sales.docNumber,
      createdAt: sales.createdAt,
      terminalName: terminals.name,
      totalCents: sales.totalCents,
      discountCents: sales.discountCents,
      status: sales.status,
      itemCount: db.$count(saleItems, eq(saleItems.saleId, sales.id)),
    })
    .from(sales)
    .innerJoin(terminals, eq(sales.terminalId, terminals.id))
    .where(and(gte(sales.createdAt, range.fromIso), lte(sales.createdAt, range.toIso)))
    .orderBy(desc(sales.id))
    .limit(limit)
    .all();
}
