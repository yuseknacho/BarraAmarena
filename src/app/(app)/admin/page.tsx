import { requireAdmin } from "@/lib/auth";
import { db, users } from "@/db";
import { eq, isNull } from "drizzle-orm";
import { PageTitle, PageHelp, Card, Button } from "@/components/ui";
import { googleEnabled } from "@/lib/google";
import { UserList } from "./user-list";

// Administración: gestión de usuarios del sistema (crear, editar, eliminar).
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const me = await requireAdmin();
  const { google } = await searchParams;
  const yo = db.select().from(users).where(eq(users.id, me.userId)).get();
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
          avatarUrl: u.avatarUrl,
        }))}
      />

      {googleEnabled() && (
        <Card className="mt-4">
          <h2 className="font-semibold mb-1">Mi cuenta de Google</h2>
          {google === "vinculada" && (
            <p className="text-sm text-brand-light mb-2">
              ✅ Cuenta de Google vinculada: tu nombre, email y foto se completaron desde Google.
            </p>
          )}
          {google === "ocupado" && (
            <p className="text-sm text-red-400 mb-2">
              Esa cuenta de Google ya está vinculada a otro usuario.
            </p>
          )}
          {yo?.googleSub ? (
            <p className="text-sm text-white/60">
              Vinculada a <span className="text-white">{yo.email}</span>. Ya podés entrar con
              &quot;Ingresar con Google&quot;.
            </p>
          ) : (
            <>
              <p className="text-sm text-white/50 mb-3">
                Vinculá tu cuenta de Google para entrar con un click y que tu nombre,
                email y foto se completen solos.
              </p>
              <a href="/api/auth/google?mode=link">
                <Button type="button">Vincular mi cuenta de Google</Button>
              </a>
            </>
          )}
        </Card>
      )}
      <PageHelp>
        Acá creás las cuentas de cada persona que usa el sistema (cajas,
        barman u otros administradores), les cambiás la contraseña o las
        eliminás. Al crear un usuario se muestra la contraseña configurada
        para que se la puedas pasar.
      </PageHelp>
    </div>
  );
}
