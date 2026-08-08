"use client";

import { useActionState, useState } from "react";
import { createSupplier, updateSupplier } from "@/actions/suppliers";
import type { Supplier } from "@/db/schema";
import { Button, Input, Label, Card, Th, Td, Badge } from "@/components/ui";

export function SupplierList({ suppliers }: { suppliers: Supplier[] }) {
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          + Nuevo proveedor
        </Button>
      </div>

      {(creating || editing) && (
        <SupplierForm
          key={editing?.id ?? "new"}
          supplier={editing}
          onDone={() => { setCreating(false); setEditing(null); }}
        />
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <Th>Nombre</Th>
              <Th>CUIT</Th>
              <Th>Teléfono</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-gray-400 py-8">
                  Sin proveedores todavía.
                </Td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className={!s.active ? "opacity-50" : ""}>
                <Td className="font-medium">{s.name}</Td>
                <Td>{s.cuit ?? "—"}</Td>
                <Td>{s.phone ?? "—"}</Td>
                <Td>{s.email ?? "—"}</Td>
                <Td>
                  <Badge color={s.active ? "green" : "red"}>
                    {s.active ? "activo" : "inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => { setEditing(s); setCreating(false); }}
                  >
                    Editar
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SupplierForm({
  supplier,
  onDone,
}: {
  supplier: Supplier | null;
  onDone: () => void;
}) {
  const action = supplier ? updateSupplier : createSupplier;
  const [state, formAction, pending] = useActionState(action, undefined);
  if (state?.ok) onDone();

  return (
    <Card>
      <h2 className="font-semibold mb-3">
        {supplier ? `Editar: ${supplier.name}` : "Nuevo proveedor"}
      </h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {supplier && <input type="hidden" name="id" value={supplier.id} />}
        <div>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={supplier?.name} required autoFocus />
        </div>
        <div>
          <Label>CUIT</Label>
          <Input name="cuit" defaultValue={supplier?.cuit ?? ""} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input name="phone" defaultValue={supplier?.phone ?? ""} />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={supplier?.email ?? ""} />
        </div>
        <div>
          <Label>Dirección</Label>
          <Input name="address" defaultValue={supplier?.address ?? ""} />
        </div>
        <div>
          <Label>Notas</Label>
          <Input name="notes" defaultValue={supplier?.notes ?? ""} />
        </div>
        {supplier && (
          <div className="flex items-center gap-2">
            <input
              id="s-active"
              type="checkbox"
              name="active"
              defaultChecked={supplier.active}
              className="h-4 w-4"
            />
            <label htmlFor="s-active" className="text-sm">Activo</label>
          </div>
        )}
        {state?.error && (
          <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">
            {state.error}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={pending}>
            {supplier ? "Guardar" : "Crear"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
