import { requireSuperAdmin } from "@/lib/auth";
import { db, users } from "@/db";
import { isNull } from "drizzle-orm";
import { PageTitle, PageHelp } from "@/components/ui";
import { UserList } from "./user-list";

// Administración: gestión de usuarios del sistema (crear, editar, eliminar).
export default async function AdminPage() {
  const me = await requireSuperAdmin();
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
        meId={me.userId}
        users={allUsers.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          active: u.active,
          email: u.email,
          role: u.role === "superadmin" ? "superadmin" : "admin",
        }))}
      />

      <PageHelp>
        Acá el Super Admin crea las cuentas de los <b>Administradores</b>:
        pueden entrar al sistema y cargar o editar toda la información
        (Contabilidad Barra y Estadísticas), pero no gestionan usuarios.
        También les cambiás la contraseña o los eliminás. Al crear un usuario
        se muestra la contraseña configurada para que se la puedas pasar.
      </PageHelp>
    </div>
  );
}
