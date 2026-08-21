import { requireAdmin } from "@/lib/auth";
import { db, users } from "@/db";
import { isNull } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { UserList } from "./user-list";

// Administración: gestión de usuarios del sistema (crear, editar, eliminar).
export default async function AdminPage() {
  await requireAdmin();
  const allUsers = db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(users.username)
    .all();

  return (
    <div>
      <PageTitle>Administración</PageTitle>
      <UserList
        users={allUsers.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          active: u.active,
          email: u.email,
        }))}
      />

      <PageHelp>
        Acá creás las cuentas de cada persona que usa el sistema (cajas,
        barman u otros administradores), les cambiás la contraseña o las
        eliminás. Al crear un usuario se muestra la contraseña configurada
        para que se la puedas pasar.
      </PageHelp>
    </div>
  );
}
