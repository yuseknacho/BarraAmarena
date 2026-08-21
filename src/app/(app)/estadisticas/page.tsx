import { requireAdmin } from "@/lib/auth";
import { db, ledgerEntries } from "@/db";
import { asc } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { StatsView } from "./stats-view";
import { getDolarBlueMensual } from "@/lib/dolar";

export default async function EstadisticasPage() {
  await requireAdmin();

  // Todo el libro en orden cronológico; el cliente filtra y agrupa
  const entries = db
    .select({
      date: ledgerEntries.date,
      type: ledgerEntries.type,
      amountCents: ledgerEntries.amountCents,
      category: ledgerEntries.category,
      name: ledgerEntries.name,
    })
    .from(ledgerEntries)
    .orderBy(asc(ledgerEntries.date), asc(ledgerEntries.id))
    .all();

  // Dólar blue promedio por mes (se actualiza solo, ver lib/dolar.ts)
  const dolar = await getDolarBlueMensual();

  return (
    <div className="space-y-4">
      <PageTitle>📈 Estadísticas</PageTitle>
      <StatsView entries={entries} dolarMeses={dolar.meses} dolarActualizado={dolar.actualizado} />
      <PageHelp>
        La evolución de la plata del negocio según lo cargado en Contabilidad
        Barra: cuánto entró (verde), cuánto se gastó (amarillo) y cuánto retiraron Nahuel, Nelsi y Miguel (rojo). Para que un retiro cuente en rojo, cargalo con la categoría "Retiro". Filtrá
        por año para ver mes a mes, o elegí un mes para verlo día por día.
      </PageHelp>
    </div>
  );
}
