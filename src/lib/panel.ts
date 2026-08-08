import {
  db,
  terminals,
  sales,
  salePayments,
  cashSessions,
  cashMovements,
  users,
} from "@/db";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { computeExpectedCash, getOpenSession } from "@/lib/cash";
import type { DateRange } from "@/lib/reports";

export interface TerminalPanel {
  id: number;
  name: string;
  session: {
    openedAt: string;
    openedBy: string;
    openingAmountCents: number;
    expectedCashCents: number;
    ingresosCents: number;
    egresosCents: number;
  } | null;
  salesCount: number;
  totalCents: number;
  profitCents: number;
  discountCents: number;
  voidedCount: number;
  byMethod: { method: string; totalCents: number }[];
}

function inRange(range: DateRange) {
  return and(
    gte(sales.createdAt, range.fromIso),
    lte(sales.createdAt, range.toIso)
  );
}

// Datos de venta y caja por terminal activa, para el panel de control.
export function getTerminalPanels(range: DateRange): TerminalPanel[] {
  const terms = db
    .select()
    .from(terminals)
    .where(eq(terminals.active, true))
    .orderBy(terminals.name)
    .all();

  return terms.map((t) => {
    const agg = db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(${sales.totalCents}), 0)`,
        cost: sql<number>`COALESCE(SUM(${sales.totalCostCents}), 0)`,
        discount: sql<number>`COALESCE(SUM(${sales.discountCents}), 0)`,
      })
      .from(sales)
      .where(
        and(eq(sales.terminalId, t.id), eq(sales.status, "completed"), inRange(range))
      )
      .get()!;

    const voided = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(
        and(eq(sales.terminalId, t.id), eq(sales.status, "voided"), inRange(range))
      )
      .get()!;

    const byMethod = db
      .select({
        method: salePayments.method,
        totalCents: sql<number>`COALESCE(SUM(${salePayments.amountCents}), 0)`,
      })
      .from(salePayments)
      .innerJoin(sales, eq(salePayments.saleId, sales.id))
      .where(
        and(eq(sales.terminalId, t.id), eq(sales.status, "completed"), inRange(range))
      )
      .groupBy(salePayments.method)
      .all();

    const open = getOpenSession(t.id);
    let session: TerminalPanel["session"] = null;
    if (open) {
      const openedBy = db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, open.openedByUserId))
        .get();
      const movs = db
        .select({
          ingresos: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'ingreso' THEN ${cashMovements.amountCents} ELSE 0 END), 0)`,
          egresos: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'egreso' THEN ${cashMovements.amountCents} ELSE 0 END), 0)`,
        })
        .from(cashMovements)
        .where(eq(cashMovements.cashSessionId, open.id))
        .get()!;
      session = {
        openedAt: open.openedAt,
        openedBy: openedBy?.fullName ?? "—",
        openingAmountCents: open.openingAmountCents,
        expectedCashCents: computeExpectedCash(open.id),
        ingresosCents: movs.ingresos,
        egresosCents: movs.egresos,
      };
    }

    return {
      id: t.id,
      name: t.name,
      session,
      salesCount: agg.count,
      totalCents: agg.total,
      profitCents: agg.total - agg.cost,
      discountCents: agg.discount,
      voidedCount: voided.count,
      byMethod,
    };
  });
}

// Cierres de caja del período (arqueos), para control de diferencias.
export function getClosedSessions(range: DateRange) {
  return db
    .select({
      id: cashSessions.id,
      terminalName: terminals.name,
      closedAt: cashSessions.closedAt,
      expectedCashCents: cashSessions.expectedCashCents,
      countedCashCents: cashSessions.countedCashCents,
      differenceCents: cashSessions.differenceCents,
    })
    .from(cashSessions)
    .innerJoin(terminals, eq(cashSessions.terminalId, terminals.id))
    .where(
      and(
        eq(cashSessions.status, "closed"),
        gte(cashSessions.closedAt, range.fromIso),
        lte(cashSessions.closedAt, range.toIso)
      )
    )
    .orderBy(cashSessions.closedAt)
    .all();
}
