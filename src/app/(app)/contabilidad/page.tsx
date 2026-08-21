import { requireAdmin } from "@/lib/auth";
import { db, ledgerEntries } from "@/db";
import { asc } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { LedgerTable, LedgerForm } from "./ledger";
import { LedgerTotals } from "./totals";

export default async function ContabilidadPage() {
  await requireAdmin();

  // Libro completo en orden cronológico, con saldo acumulado por operación
  const entries = db
    .select()
    .from(ledgerEntries)
    .orderBy(asc(ledgerEntries.date), asc(ledgerEntries.id))
    .all();

  let saldo = 0;
  const rows = entries
    .map((e) => {
      saldo += e.type === "ingreso" ? e.amountCents : -e.amountCents;
      return { ...e, saldoCents: saldo };
    })
    // Se muestran los más recientes arriba (el saldo ya quedó calculado en orden cronológico)
    .reverse();

  const categories = [...new Set(entries.map((e) => e.category))].sort();

  return (
    <div className="space-y-4">
      <PageTitle>Contabilidad Barra</PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mitad izquierda: libro estilo Excel */}
        <LedgerTable rows={rows} />

        {/* Mitad derecha: resumen y carga de movimientos */}
        <div className="space-y-4">
          <LedgerTotals
            entries={entries.map((e) => ({
              date: e.date,
              type: e.type,
              amountCents: e.amountCents,
            }))}
          />

          <LedgerForm existingCategories={categories} />
        </div>
      </div>

      <PageHelp>
        Libro contable independiente: acá solo aparece lo que cargás a mano.
        No se mezcla con las ventas, cajas ni reportes del sistema — ningún
        número de las otras pestañas entra ni sale de este libro. Cada fila
        muestra el saldo que va quedando después de esa operación.
      </PageHelp>
    </div>
  );
}
