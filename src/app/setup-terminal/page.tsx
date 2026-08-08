import { requireUser } from "@/lib/auth";
import { getTerminal } from "@/lib/terminal";
import { db, terminals } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { linkTerminal } from "@/actions/terminals";
import { Button, Card } from "@/components/ui";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SetupTerminalPage() {
  const user = await requireUser();
  const current = await getTerminal();
  if (current) redirect("/caja");

  const available = db
    .select()
    .from(terminals)
    .where(and(eq(terminals.active, true), isNull(terminals.deviceToken)))
    .orderBy(terminals.name)
    .all();

  return (
    <div className="min-h-screen flex items-center justify-center stage-lights p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold mb-1">Vincular terminal</h1>
        <p className="text-sm text-white/50 mb-4">
          Este dispositivo todavía no está asignado a un puesto de venta. Elegí
          qué caja va a ser.
        </p>
        {available.length === 0 ? (
          <div className="text-sm text-white/70 space-y-3">
            <p>
              No hay terminales disponibles.{" "}
              {user.role === "admin"
                ? "Creá una desde Administración → Terminales."
                : "Pedile a un administrador que cree una terminal o desvincule una existente."}
            </p>
            {user.role === "admin" && (
              <Link href="/admin/terminales">
                <Button>Ir a Terminales</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {available.map((t) => (
              <form key={t.id} action={linkTerminal}>
                <input type="hidden" name="terminalId" value={t.id} />
                <Button type="submit" variant="secondary" className="w-full justify-between">
                  <span>{t.name}</span>
                  <span className="text-brand">Usar esta →</span>
                </Button>
              </form>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
