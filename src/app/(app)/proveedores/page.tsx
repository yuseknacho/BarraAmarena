import { requireAdmin } from "@/lib/auth";
import { db, suppliers } from "@/db";
import { PageTitle } from "@/components/ui";
import { SupplierList } from "./supplier-list";

export default async function ProveedoresPage() {
  await requireAdmin();
  const rows = db.select().from(suppliers).orderBy(suppliers.name).all();
  return (
    <div>
      <PageTitle>Proveedores</PageTitle>
      <SupplierList suppliers={rows} />
    </div>
  );
}
