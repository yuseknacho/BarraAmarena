import { requireSuperAdmin } from "@/lib/auth";
import { db, ledgerEntries } from "@/db";
import { asc } from "drizzle-orm";
import { PageTitle, Card, PageHelp } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { LedgerTable, LedgerForm } from "./ledger";

export default async function ContabilidadPage() {
  await requireSuperAdmin();

  // Libro completo en orden cronológico, con saldo acumulado por operación
  const entries = db
    .select()
    .from(ledgerEntries)
    .orderBy(asc(ledgerEntries.date), asc(ledgerEntries.id))
    .all();

  let saldo = 0;
  const rows = entries.map((e) => {
    saldo += e.type === "ingreso" ? e.amountCents : -e.amountCents;
    return { ...e, saldoCents: saldo };
  });

  const ingresos = entries
    .filter((e) => e.type === "ingreso")
    .reduce((a, e) => a + e.amountCents, 0);
  const egresos = entries
    .filter((e) => e.type === "egreso")
    .reduce((a, e) => a + e.amountCents, 0);

  const categories = [...new Set(entries.map((e) => e.category))].sort();

  return (
    <div className="space-y-4">
      <PageTitle>Contabilidad Barra</PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mitad izquierda: libro estilo Excel */}
        <LedgerTable rows={rows} />

        {/* Mitad derecha: resumen y carga de movimientos */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <p className="text-xs text-white/50 uppercase">Ingresos</p>
              <p className="text-lg font-bold text-brand-light">
                {formatCents(ingresos)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-white/50 uppercase">Egresos</p>
              <p className="text-lg font-bold text-red-400">
                {formatCents(egresos)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-white/50 uppercase">Saldo</p>
              <p
                className={`text-lg font-bold ${
                  ingresos - egresos >= 0 ? "text-brand-light" : "text-red-400"
                }`}
              >
                {formatCents(ingresos - egresos)}
              </p>
            </Card>
          </div>

          <LedgerForm existingCategories={categories} />
        </div>
      </div>

      <PageHelp>
        El libro contable manual de la barra: anotá acá los movimientos de plata
        que no pasan por las cajas (alquiler, sueldos, proveedores pagados por
        fuera, aportes, retiros). Cada fila muestra el saldo que va quedando
        después de esa operación. Las ventas del sistema ya se controlan desde
        el Panel y Reportes.
      </PageHelp>
    </div>
  );
}
