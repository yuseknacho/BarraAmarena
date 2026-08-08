import { requireUser } from "@/lib/auth";
import { db, customers } from "@/db";
import { PageTitle } from "@/components/ui";
import { CustomerList } from "./customer-list";

export default async function ClientesPage() {
  await requireUser();
  const rows = db.select().from(customers).orderBy(customers.name).all();
  return (
    <div>
      <PageTitle>Clientes</PageTitle>
      <CustomerList customers={rows} />
    </div>
  );
}
