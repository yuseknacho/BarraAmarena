"use client";

import { useActionState } from "react";
import { saveSettings, createBackup } from "@/actions/settings";
import { Button, Input, Label, Select, Card } from "@/components/ui";

export function SettingsForm({
  businessName,
  ticketWidth,
  ticketFooter,
}: {
  businessName: string;
  ticketWidth: string;
  ticketFooter: string;
}) {
  const [state, formAction, pending] = useActionState(saveSettings, undefined);

  return (
    <Card>
      <h2 className="font-semibold mb-3">Datos del negocio</h2>
      <form action={formAction} className="space-y-3">
        <div>
          <Label>Nombre del negocio (aparece en el ticket)</Label>
          <Input name="businessName" defaultValue={businessName} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Ancho del ticket</Label>
            <Select name="ticketWidth" defaultValue={ticketWidth}>
              <option value="80">80 mm</option>
              <option value="58">58 mm</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Pie del ticket</Label>
          <Input name="ticketFooter" defaultValue={ticketFooter} />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-light">Configuración guardada.</p>}
        <Button type="submit" disabled={pending}>Guardar</Button>
      </form>
    </Card>
  );
}

export function BackupPanel({
  backups,
}: {
  backups: { name: string; size: number }[];
}) {
  const [state, formAction, pending] = useActionState(createBackup, undefined);

  return (
    <Card>
      <h2 className="font-semibold mb-1">Respaldo de datos</h2>
      <p className="text-sm text-white/50 mb-3">
        Crea una copia completa de la base de datos en la carpeta{" "}
        <code className="bg-white/10 px-1 rounded">data/backups</code> del
        sistema. Guardá esas copias también en un pendrive o en la nube.
      </p>
      <form action={formAction}>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando respaldo…" : "Crear respaldo ahora"}
        </Button>
      </form>
      {state?.message && (
        <p className="text-sm text-brand-light mt-2">{state.message}</p>
      )}
      {state?.error && <p className="text-sm text-red-400 mt-2">{state.error}</p>}

      {backups.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-white/80 mb-1">
            Últimos respaldos
          </h3>
          <ul className="text-sm text-white/70 space-y-0.5">
            {backups.map((b) => (
              <li key={b.name} className="font-mono text-xs">
                {b.name} ({(b.size / 1024 / 1024).toFixed(1)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
