import { requireAdmin } from "@/lib/auth";
import { db, sales, saleItems, terminals, users } from "@/db";
import { and, gte, lte, eq } from "drizzle-orm";
import { toRange, todayLocal } from "@/lib/reports";
import { NextRequest } from "next/server";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  await requireAdmin();
  const { searchParams } = request.nextUrl;
  const today = todayLocal();
  const from = searchParams.get("from") || today;
  const to = searchParams.get("to") || today;
  const range = toRange(from, to);

  const rows = db
    .select({
      docNumber: sales.docNumber,
      createdAt: sales.createdAt,
      terminalName: terminals.name,
      userName: users.fullName,
      status: sales.status,
      description: saleItems.description,
      qty: saleItems.qty,
      unitPriceCents: saleItems.unitPriceCents,
      unitCostCents: saleItems.unitCostCents,
      lineTotalCents: saleItems.lineTotalCents,
      saleTotalCents: sales.totalCents,
      saleDiscountCents: sales.discountCents,
    })
    .from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .innerJoin(terminals, eq(sales.terminalId, terminals.id))
    .innerJoin(users, eq(sales.userId, users.id))
    .where(and(gte(sales.createdAt, range.fromIso), lte(sales.createdAt, range.toIso)))
    .orderBy(sales.id)
    .all();

  const header = [
    "ticket",
    "fecha",
    "terminal",
    "vendedor",
    "estado",
    "producto",
    "cantidad",
    "precio_unitario",
    "costo_unitario",
    "total_linea",
    "descuento_venta",
    "total_venta",
  ].join(";");

  const lines = rows.map((r) =>
    [
      String(r.docNumber).padStart(8, "0"),
      new Date(r.createdAt).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
      }),
      csvEscape(r.terminalName),
      csvEscape(r.userName),
      r.status === "completed" ? "completada" : "anulada",
      csvEscape(r.description),
      r.qty,
      (r.unitPriceCents / 100).toFixed(2),
      (r.unitCostCents / 100).toFixed(2),
      (r.lineTotalCents / 100).toFixed(2),
      (r.saleDiscountCents / 100).toFixed(2),
      (r.saleTotalCents / 100).toFixed(2),
    ].join(";")
  );

  // BOM para que Excel abra el CSV con acentos correctos
  const csv = "﻿" + [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas_${from}_${to}.csv"`,
    },
  });
}
