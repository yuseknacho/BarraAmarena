import { requireAdmin } from "@/lib/auth";
import { db, customers } from "@/db";
import { PageTitle, PageHelp } from "@/components/ui";
import { CustomerList } from "./customer-list";

export default async function ClientesPage() {
  await requireAdmin();
  const rows = db.select().from(customers).orderBy(customers.name).all();
  return (
    <div>
      <PageTitle>Clientes</PageTitle>
      <CustomerList customers={rows} />
      <PageHelp>Tus clientes frecuentes, para asociarlos a una venta desde la pantalla de vender. Las ventas comunes salen como "Consumidor final" sin cargar nada acá.</PageHelp>
    </div>
  );
}
