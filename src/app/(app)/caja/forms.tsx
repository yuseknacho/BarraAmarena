"use client";

import { useActionState, useState } from "react";
import {
  openCashSession,
  addCashMovement,
  closeCashSession,
} from "@/actions/cash";
import { Button, Input, Label, Select } from "@/components/ui";
import { formatCents, pesosToCents } from "@/lib/money";

export function OpenSessionForm() {
  const [state, formAction, pending] = useActionState(openCashSession, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label>Monto inicial en efectivo ($)</Label>
        <Input
          name="openingAmount"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          required
          autoFocus
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        Abrir caja
      </Button>
    </form>
  );
}

export function MovementForm() {
  const [state, formAction, pending] = useActionState(addCashMovement, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select name="type" defaultValue="egreso">
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </Select>
        </div>
        <div>
          <Label>Monto ($)</Label>
          <Input name="amount" type="number" step="0.01" min="0.01" required />
        </div>
      </div>
      <div>
        <Label>Motivo</Label>
        <Input name="reason" placeholder="Ej: pago a proveedor, cambio…" required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Movimiento registrado.</p>}
      <Button type="submit" disabled={pending}>
        Registrar movimiento
      </Button>
    </form>
  );
}

export function CloseSessionForm({ expectedCents }: { expectedCents: number }) {
  const [state, formAction, pending] = useActionState(closeCashSession, undefined);
  const [counted, setCounted] = useState("");

  const countedCents = counted === "" ? null : pesosToCents(counted);
  const diff = countedCents === null ? null : countedCents - expectedCents;

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Efectivo esperado</Label>
          <p className="py-2 text-sm font-semibold">{formatCents(expectedCents)}</p>
        </div>
        <div>
          <Label>Efectivo contado ($)</Label>
          <Input
            name="countedCash"
            type="number"
            step="0.01"
            min="0"
            required
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
          />
        </div>
      </div>
      {diff !== null && (
        <p
          className={`text-sm font-medium ${
            diff === 0 ? "text-green-700" : diff < 0 ? "text-red-600" : "text-yellow-700"
          }`}
        >
          {diff === 0
            ? "Caja cuadrada ✓"
            : diff < 0
              ? `Faltante: ${formatCents(-diff)}`
              : `Sobrante: ${formatCents(diff)}`}
        </p>
      )}
      <div>
        <Label>Notas (opcional)</Label>
        <Input name="notes" placeholder="Observaciones del cierre…" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        variant="danger"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("¿Cerrar la caja? Esta acción no se puede deshacer.")) {
            e.preventDefault();
          }
        }}
      >
        Cerrar caja
      </Button>
    </form>
  );
}
