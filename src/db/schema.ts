import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "cajero"] })
    .notNull()
    .default("cajero"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now),
});

export const terminals = sqliteTable("terminals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  deviceToken: text("device_token").unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    barcode: text("barcode"),
    name: text("name").notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    costCents: integer("cost_cents").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    taxRate: real("tax_rate"),
    stock: real("stock").notNull().default(0),
    minStock: real("min_stock"),
    unit: text("unit").notNull().default("u"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("products_barcode_idx")
      .on(t.barcode)
      .where(sql`barcode IS NOT NULL`),
    index("products_name_idx").on(t.name),
  ]
);

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  docNumber: text("doc_number"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cuit: text("cuit"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(now),
});

export const cashSessions = sqliteTable(
  "cash_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    terminalId: integer("terminal_id")
      .notNull()
      .references(() => terminals.id),
    openedByUserId: integer("opened_by_user_id")
      .notNull()
      .references(() => users.id),
    openedAt: text("opened_at").notNull().default(now),
    openingAmountCents: integer("opening_amount_cents").notNull().default(0),
    closedByUserId: integer("closed_by_user_id").references(() => users.id),
    closedAt: text("closed_at"),
    expectedCashCents: integer("expected_cash_cents"),
    countedCashCents: integer("counted_cash_cents"),
    differenceCents: integer("difference_cents"),
    status: text("status", { enum: ["open", "closed"] })
      .notNull()
      .default("open"),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("cash_sessions_open_terminal_idx")
      .on(t.terminalId)
      .where(sql`status = 'open'`),
    index("cash_sessions_opened_at_idx").on(t.openedAt),
  ]
);

export const cashMovements = sqliteTable(
  "cash_movements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cashSessionId: integer("cash_session_id")
      .notNull()
      .references(() => cashSessions.id),
    type: text("type", { enum: ["ingreso", "egreso"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    reason: text("reason").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("cash_movements_session_idx").on(t.cashSessionId)]
);

export const documentCounters = sqliteTable("document_counters", {
  docType: text("doc_type").primaryKey(),
  nextNumber: integer("next_number").notNull().default(1),
});

export const sales = sqliteTable(
  "sales",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    docType: text("doc_type", { enum: ["ticket", "presupuesto"] })
      .notNull()
      .default("ticket"),
    docNumber: integer("doc_number").notNull(),
    terminalId: integer("terminal_id")
      .notNull()
      .references(() => terminals.id),
    cashSessionId: integer("cash_session_id").references(() => cashSessions.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    customerId: integer("customer_id").references(() => customers.id),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    totalCostCents: integer("total_cost_cents").notNull().default(0),
    status: text("status", { enum: ["completed", "voided"] })
      .notNull()
      .default("completed"),
    voidedAt: text("voided_at"),
    voidedByUserId: integer("voided_by_user_id").references(() => users.id),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("sales_doc_idx").on(t.docType, t.docNumber),
    index("sales_created_at_idx").on(t.createdAt),
    index("sales_cash_session_idx").on(t.cashSessionId),
  ]
);

export const saleItems = sqliteTable(
  "sale_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    saleId: integer("sale_id")
      .notNull()
      .references(() => sales.id),
    productId: integer("product_id").references(() => products.id),
    description: text("description").notNull(),
    qty: real("qty").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull().default(0),
    taxRate: real("tax_rate"),
    discountCents: integer("discount_cents").notNull().default(0),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [
    index("sale_items_sale_idx").on(t.saleId),
    index("sale_items_product_idx").on(t.productId),
  ]
);

export const salePayments = sqliteTable(
  "sale_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    saleId: integer("sale_id")
      .notNull()
      .references(() => sales.id),
    method: text("method", {
      enum: ["efectivo", "tarjeta", "transferencia", "otro"],
    }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    reference: text("reference"),
  },
  (t) => [index("sale_payments_sale_idx").on(t.saleId)]
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    invoiceRef: text("invoice_ref"),
    totalCents: integer("total_cents").notNull().default(0),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("purchases_created_at_idx").on(t.createdAt)]
);

export const purchaseItems = sqliteTable(
  "purchase_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    qty: real("qty").notNull(),
    unitCostCents: integer("unit_cost_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (t) => [index("purchase_items_purchase_idx").on(t.purchaseId)]
);

export const stockMovements = sqliteTable(
  "stock_movements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    type: text("type", {
      enum: ["venta", "compra", "ajuste", "anulacion"],
    }).notNull(),
    qtyDelta: real("qty_delta").notNull(),
    stockAfter: real("stock_after").notNull(),
    refTable: text("ref_table"),
    refId: integer("ref_id"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    index("stock_movements_product_idx").on(t.productId),
    index("stock_movements_created_at_idx").on(t.createdAt),
  ]
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type User = typeof users.$inferSelect;
export type Terminal = typeof terminals.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type CashSession = typeof cashSessions.$inferSelect;
export type CashMovement = typeof cashMovements.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type SalePayment = typeof salePayments.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
