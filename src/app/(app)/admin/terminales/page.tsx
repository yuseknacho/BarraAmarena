import { requireAdmin } from "@/lib/auth";
import { db, terminals } from "@/db";
import { PageTitle, Card, Th, Td, Badge, Button } from "@/components/ui";
import { unlinkTerminal, setTerminalActive } from "@/actions/terminals";
import { NewTerminalForm } from "./new-terminal-form";

export default async function TerminalesPage() {
  await requireAdmin();
  const rows = db.select().from(terminals).orderBy(terminals.name).all();

  return (
    <div className="space-y-4">
      <PageTitle>Terminales (puestos de venta)</PageTitle>
      <NewTerminalForm />
      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Nombre</Th>
              <Th>Dispositivo</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 && (
              <tr>
                <Td colSpan={4} className="text-center text-white/40 py-8">
                  Creá la primera terminal, por ejemplo “Caja 1”.
                </Td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id}>
                <Td className="font-medium">{t.name}</Td>
                <Td>
                  {t.deviceToken ? (
                    <Badge color="green">vinculada</Badge>
                  ) : (
                    <Badge color="gray">sin vincular</Badge>
                  )}
                </Td>
                <Td>
                  <Badge color={t.active ? "green" : "red"}>
                    {t.active ? "activa" : "inactiva"}
                  </Badge>
                </Td>
                <Td className="text-right space-x-2">
                  {t.deviceToken && (
                    <form action={unlinkTerminal} className="inline">
                      <input type="hidden" name="terminalId" value={t.id} />
                      <Button variant="ghost" type="submit">
                        Desvincular
                      </Button>
                    </form>
                  )}
                  <form action={setTerminalActive} className="inline">
                    <input type="hidden" name="terminalId" value={t.id} />
                    <input type="hidden" name="active" value={t.active ? "0" : "1"} />
                    <Button variant="ghost" type="submit">
                      {t.active ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-sm text-white/50">
        Cada navegador se vincula a una terminal la primera vez que entra a
        Caja. Para mover una caja a otra computadora, primero desvinculala acá.
      </p>
    </div>
  );
}
