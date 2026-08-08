"use client";

import { useActionState, useState } from "react";
import { createCustomer, updateCustomer } from "@/actions/customers";
import type { Customer } from "@/db/schema";
import { Button, Input, Label, Card, Th, Td, Badge } from "@/components/ui";

export function CustomerList({ customers }: { customers: Customer[] }) {
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          + Nuevo cliente
        </Button>
      </div>

      {(creating || editing) && (
        <CustomerForm
          key={editing?.id ?? "new"}
          customer={editing}
          onDone={() => { setCreating(false); setEditing(null); }}
        />
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <Th>Nombre</Th>
              <Th>DNI/CUIT</Th>
              <Th>Teléfono</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-gray-400 py-8">
                  Sin clientes registrados. Las ventas pueden hacerse a
                  “Consumidor final” sin cargar clientes.
                </Td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className={!c.active ? "opacity-50" : ""}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.docNumber ?? "—"}</Td>
                <Td>{c.phone ?? "—"}</Td>
                <Td>{c.email ?? "—"}</Td>
                <Td>
                  <Badge color={c.active ? "green" : "red"}>
                    {c.active ? "activo" : "inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => { setEditing(c); setCreating(false); }}
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

function CustomerForm({
  customer,
  onDone,
}: {
  customer: Customer | null;
  onDone: () => void;
}) {
  const action = customer ? updateCustomer : createCustomer;
  const [state, formAction, pending] = useActionState(action, undefined);
  if (state?.ok) onDone();

  return (
    <Card>
      <h2 className="font-semibold mb-3">
        {customer ? `Editar: ${customer.name}` : "Nuevo cliente"}
      </h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {customer && <input type="hidden" name="id" value={customer.id} />}
        <div>
          <Label>Nombre</Label>
          <Input name="name" defaultValue={customer?.name} required autoFocus />
        </div>
        <div>
          <Label>DNI / CUIT</Label>
          <Input name="docNumber" defaultValue={customer?.docNumber ?? ""} />
        </div>
        <div>
          <Label>Teléfono</Label>
          <Input name="phone" defaultValue={customer?.phone ?? ""} />
        </div>
        <div>
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={customer?.email ?? ""} />
        </div>
        <div>
          <Label>Notas</Label>
          <Input name="notes" defaultValue={customer?.notes ?? ""} />
        </div>
        {customer && (
          <div className="flex items-center gap-2">
            <input
              id="c-active"
              type="checkbox"
              name="active"
              defaultChecked={customer.active}
              className="h-4 w-4"
            />
            <label htmlFor="c-active" className="text-sm">Activo</label>
          </div>
        )}
        {state?.error && (
          <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">
            {state.error}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
          <Button type="submit" disabled={pending}>
            {customer ? "Guardar" : "Crear"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
