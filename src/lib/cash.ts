import { db, cashSessions, cashMovements, sales, salePayments } from "@/db";
import { and, eq, sql } from "drizzle-orm";

// Efectivo esperado en caja: apertura + ingresos − egresos + ventas en efectivo.
export function computeExpectedCash(sessionId: number): number {
  const session = db
    .select()
    .from(cashSessions)
    .where(eq(cashSessions.id, sessionId))
    .get();
  if (!session) return 0;

  const movs = db
    .select({
      total: sql<number>`COALESCE(SUM(CASE WHEN ${cashMovements.type} = 'ingreso' THEN ${cashMovements.amountCents} ELSE -${cashMovements.amountCents} END), 0)`,
    })
    .from(cashMovements)
    .where(eq(cashMovements.cashSessionId, sessionId))
    .get();

  const cashSales = db
    .select({
      total: sql<number>`COALESCE(SUM(${salePayments.amountCents}), 0)`,
    })
    .from(salePayments)
    .innerJoin(sales, eq(salePayments.saleId, sales.id))
    .where(
      and(
        eq(sales.cashSessionId, sessionId),
        eq(sales.status, "completed"),
        eq(salePayments.method, "efectivo")
      )
    )
    .get();

  return (
    session.openingAmountCents + (movs?.total ?? 0) + (cashSales?.total ?? 0)
  );
}

export function getOpenSession(terminalId: number) {
  return db
    .select()
    .from(cashSessions)
    .where(
      and(eq(cashSessions.terminalId, terminalId), eq(cashSessions.status, "open"))
    )
    .get();
}

// Totales de ventas de la sesión por medio de pago (solo completadas).
export function getSessionSalesTotals(sessionId: number) {
  return db
    .select({
      method: salePayments.method,
      total: sql<number>`COALESCE(SUM(${salePayments.amountCents}), 0)`,
      count: sql<number>`COUNT(DISTINCT ${sales.id})`,
    })
    .from(salePayments)
    .innerJoin(sales, eq(salePayments.saleId, sales.id))
    .where(
      and(eq(sales.cashSessionId, sessionId), eq(sales.status, "completed"))
    )
    .groupBy(salePayments.method)
    .all();
}
