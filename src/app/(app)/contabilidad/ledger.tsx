"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLedgerEntry, deleteLedgerEntry } from "@/actions/ledger";
import { formatCents } from "@/lib/money";
import { Button, Input, Label, Select, Card, Th, Td } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface LedgerRow {
  id: number;
  date: string;
  category: string;
  name: string;
  type: "ingreso" | "egreso";
  amountCents: number;
  saldoCents: number;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function LedgerTable({ rows }: { rows: LedgerRow[] }) {
  const router = useRouter();
  const [, startDelete] = useTransition();
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<LedgerRow | null>(null);

  const onDelete = (row: LedgerRow) => setToDelete(row);

  const confirmDelete = () => {
    const row = toDelete;
    if (!row) return;
    setToDelete(null);
    startDelete(async () => {
      const result = await deleteLedgerEntry(row.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card className="p-0 overflow-hidden flex flex-col max-h-[70vh]">
      <div className="px-4 pt-4 pb-2 font-semibold border-b border-white/10 flex items-baseline justify-between gap-2">
        <span>Libro de movimientos</span>
        <span className="text-xs font-normal text-white/40">más recientes arriba</span>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5 sticky top-0 backdrop-blur">
            <tr>
              <Th>Fecha</Th>
              <Th>Categoría</Th>
              <Th>Nombre de movimiento</Th>
              <Th className="text-right">Egreso</Th>
              <Th className="text-right">Ingreso</Th>
              <Th className="text-right">Saldo</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-white/40 py-10">
                  Sin movimientos todavía. Cargá el primero desde el formulario.
                </Td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <Td className="whitespace-nowrap">{fmtDate(r.date)}</Td>
                <Td className="text-white/70">{r.category}</Td>
                <Td>{r.name}</Td>
                <Td className="text-right text-red-400">
                  {r.type === "egreso" ? formatCents(r.amountCents) : ""}
                </Td>
                <Td className="text-right text-brand-light">
                  {r.type === "ingreso" ? formatCents(r.amountCents) : ""}
                </Td>
                <Td
                  className={`text-right font-semibold ${
                    r.saldoCents >= 0 ? "" : "text-red-400"
                  }`}
                >
                  {formatCents(r.saldoCents)}
                </Td>
                <Td className="text-center">
                  <button
                    onClick={() => onDelete(r)}
                    className="text-white/30 hover:text-red-400 cursor-pointer"
                    title="Eliminar movimiento"
                  >
                    ✕
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-sm text-red-400 px-4 py-2">{error}</p>}

      <ConfirmDialog
        open={toDelete !== null}
        title="¿Eliminar este movimiento?"
        message={
          toDelete
            ? `"${toDelete.name}" (${formatCents(toDelete.amountCents)}). El saldo se recalcula automáticamente.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </Card>
  );
}

export function LedgerForm({
  existingCategories,
}: {
  existingCategories: string[];
}) {
  const [state, formAction, pending] = useActionState(createLedgerEntry, undefined);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <Card>
      <h2 className="font-semibold mb-3">Nuevo movimiento</h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Fecha</Label>
          <Input name="date" type="date" defaultValue={todayStr} required />
        </div>
        <div>
          <Label>Categoría</Label>
          <Input
            name="category"
            list="ledger-categories"
            placeholder="Ej: Alquiler, Sueldos, Proveedores…"
            required
          />
          <datalist id="ledger-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <Label>Nombre de movimiento</Label>
          <Input
            name="name"
            placeholder="Ej: pago alquiler agosto, aporte socio…"
            required
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select name="type" defaultValue="egreso">
            <option value="egreso">Egreso (sale dinero)</option>
            <option value="ingreso">Ingreso (entra dinero)</option>
          </Select>
        </div>
        <div>
          <Label>Monto ($)</Label>
          <Input name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        {state?.error && (
          <p className="text-sm text-red-400 sm:col-span-2">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-brand-light sm:col-span-2">
            Movimiento registrado.
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            Registrar movimiento
          </Button>
        </div>
      </form>
    </Card>
  );
}
