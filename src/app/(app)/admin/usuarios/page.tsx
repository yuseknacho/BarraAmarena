import { requireAdmin } from "@/lib/auth";
import { db, users } from "@/db";
import { PageTitle } from "@/components/ui";
import { UserList } from "./user-list";

export default async function UsuariosPage() {
  await requireAdmin();
  const allUsers = db.select().from(users).orderBy(users.username).all();
  return (
    <div>
      <PageTitle>Usuarios</PageTitle>
      <UserList
        users={allUsers.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          active: u.active,
        }))}
      />
    </div>
  );
}
