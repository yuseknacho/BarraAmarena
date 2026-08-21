import { requireAdmin } from "@/lib/auth";
import { db, ledgerEntries } from "@/db";
import { asc } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { StatsView } from "./stats-view";

export default async function EstadisticasPage() {
  await requireAdmin();

  // Todo el libro en orden cronológico; el cliente filtra y agrupa
  const entries = db
    .select({
      date: ledgerEntries.date,
      type: ledgerEntries.type,
      amountCents: ledgerEntries.amountCents,
      category: ledgerEntries.category,
    })
    .from(ledgerEntries)
    .orderBy(asc(ledgerEntries.date), asc(ledgerEntries.id))
    .all();

  return (
    <div className="space-y-4">
      <PageTitle>📈 Estadísticas</PageTitle>
      <StatsView entries={entries} />
      <PageHelp>
        La evolución de la plata del negocio según lo cargado en Contabilidad
        Barra: cuánto entró, cuánto salió y cómo fue variando el saldo. Filtrá
        por año para ver mes a mes, o elegí un mes para verlo día por día.
      </PageHelp>
    </div>
  );
}
