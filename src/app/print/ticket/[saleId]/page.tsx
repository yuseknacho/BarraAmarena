import { requireUser } from "@/lib/auth";
import {
  db,
  sales,
  saleItems,
  salePayments,
  terminals,
  users,
  customers,
} from "@/db";
import { eq } from "drizzle-orm";
import { getAllSettings } from "@/lib/settings";
import { formatCents, formatDate } from "@/lib/money";
import { notFound } from "next/navigation";
import { PrintControls } from "./print-controls";

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

function fmtQty(qty: number): string {
  return Number.isInteger(qty)
    ? qty.toString()
    : qty.toFixed(3).replace(/\.?0+$/, "");
}

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ saleId: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  await requireUser();
  const { saleId } = await params;
  const { auto } = await searchParams;

  const sale = db
    .select()
    .from(sales)
    .where(eq(sales.id, Number(saleId)))
    .get();
  if (!sale) notFound();

  const items = db
    .select()
    .from(saleItems)
    .where(eq(saleItems.saleId, sale.id))
    .all();
  const payments = db
    .select()
    .from(salePayments)
    .where(eq(salePayments.saleId, sale.id))
    .all();
  const terminal = db
    .select()
    .from(terminals)
    .where(eq(terminals.id, sale.terminalId))
    .get();
  const seller = db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, sale.userId))
    .get();
  const customer = sale.customerId
    ? db.select().from(customers).where(eq(customers.id, sale.customerId)).get()
    : null;

  const settings = getAllSettings();
  const width = settings.ticket_width === "58" ? "58mm" : "80mm";

  return (
    <div className="ticket">
      <style>{`
        body { background: #fff !important; }
        .ticket {
          font-family: "Courier New", monospace;
          font-size: 12px;
          width: ${width};
          margin: 0 auto;
          padding: 4mm 2mm;
          color: #000;
          background: #fff;
        }
        .ticket .center { text-align: center; }
        .ticket .bold { font-weight: bold; }
        .ticket .row { display: flex; justify-content: space-between; gap: 4px; }
        .ticket .sep { border-top: 1px dashed #000; margin: 6px 0; }
        .ticket .total { font-size: 16px; font-weight: bold; }
        .ticket .voided {
          font-size: 20px; font-weight: bold; text-align: center;
          border: 2px solid #000; padding: 4px; margin: 6px 0;
        }
        @media print {
          .no-print { display: none !important; }
          .ticket { width: ${width}; padding: 0; }
        }
        @page { margin: 0; size: ${width} auto; }
      `}</style>

      <PrintControls auto={auto === "1" && sale.status === "completed"} />

      <div className="center bold" style={{ fontSize: 15 }}>
        {settings.business_name}
      </div>
      <div className="center">{terminal?.name}</div>
      <div className="sep" />
      <div className="row">
        <span>TICKET</span>
        <span className="bold">N° {String(sale.docNumber).padStart(8, "0")}</span>
      </div>
      <div>{formatDate(sale.createdAt)}</div>
      <div>Atendió: {seller?.fullName}</div>
      {customer && <div>Cliente: {customer.name}</div>}
      {sale.status === "voided" && <div className="voided">ANULADO</div>}
      <div className="sep" />

      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: 4 }}>
          <div style={{ wordBreak: "break-word" }}>{item.description}</div>
          <div className="row">
            <span>
              {fmtQty(item.qty)} x {formatCents(item.unitPriceCents)}
            </span>
            <span>{formatCents(item.lineTotalCents)}</span>
          </div>
        </div>
      ))}

      <div className="sep" />
      {sale.discountCents > 0 && (
        <>
          <div className="row">
            <span>Subtotal</span>
            <span>{formatCents(sale.subtotalCents)}</span>
          </div>
          <div className="row">
            <span>Descuento</span>
            <span>-{formatCents(sale.discountCents)}</span>
          </div>
        </>
      )}
      <div className="row total">
        <span>TOTAL</span>
        <span>{formatCents(sale.totalCents)}</span>
      </div>
      <div className="sep" />

      {payments.map((p) => (
        <div key={p.id} className="row">
          <span>
            {methodLabels[p.method]}
            {p.reference ? ` (${p.reference})` : ""}
          </span>
          <span>{formatCents(p.amountCents)}</span>
        </div>
      ))}

      <div className="sep" />
      <div className="center">{settings.ticket_footer}</div>
      <div className="center" style={{ marginTop: 4, fontSize: 10 }}>
        Comprobante no válido como factura
      </div>
    </div>
  );
}
