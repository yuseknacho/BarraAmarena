"use client";

import { useActionState, useState } from "react";
import { createUser, updateUser } from "@/actions/users";
import { Button, Input, Label, Select, Card, Th, Td, Badge } from "@/components/ui";

interface UserRow {
  id: number;
  username: string;
  fullName: string;
  role: "admin" | "cajero";
  active: boolean;
}

export function UserList({ users }: { users: UserRow[] }) {
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          + Nuevo usuario
        </Button>
      </div>

      {creating && <CreateForm onDone={() => setCreating(false)} />}
      {editing && (
        <EditForm user={editing} onDone={() => setEditing(null)} />
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Usuario</Th>
              <Th>Nombre</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.username}</Td>
                <Td>{u.fullName}</Td>
                <Td>
                  <Badge color={u.role === "admin" ? "blue" : "gray"}>
                    {u.role}
                  </Badge>
                </Td>
                <Td>
                  <Badge color={u.active ? "green" : "red"}>
                    {u.active ? "activo" : "inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => { setEditing(u); setCreating(false); }}
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

function CreateForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, undefined);
  if (state?.ok) onDone();

  return (
    <Card>
      <h2 className="font-semibold mb-3">Nuevo usuario</h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Usuario</Label>
          <Input name="username" required autoFocus />
        </div>
        <div>
          <Label>Nombre completo</Label>
          <Input name="fullName" required />
        </div>
        <div>
          <Label>Contraseña</Label>
          <Input name="password" type="password" required />
        </div>
        <div>
          <Label>Rol</Label>
          <Select name="role" defaultValue="cajero">
            <option value="cajero">Cajero</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        {state?.error && (
          <p className="text-sm text-red-400 sm:col-span-2">{state.error}</p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>Crear</Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function EditForm({ user, onDone }: { user: UserRow; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateUser, undefined);
  if (state?.ok) onDone();

  return (
    <Card>
      <h2 className="font-semibold mb-3">Editar: {user.username}</h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={user.id} />
        <div>
          <Label>Nombre completo</Label>
          <Input name="fullName" defaultValue={user.fullName} required />
        </div>
        <div>
          <Label>Rol</Label>
          <Select name="role" defaultValue={user.role}>
            <option value="cajero">Cajero</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        <div>
          <Label>Nueva contraseña (vacío = no cambiar)</Label>
          <Input name="password" type="password" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            id="active"
            type="checkbox"
            name="active"
            defaultChecked={user.active}
            className="h-4 w-4"
          />
          <label htmlFor="active" className="text-sm">Activo</label>
        </div>
        {state?.error && (
          <p className="text-sm text-red-400 sm:col-span-2">{state.error}</p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>Guardar</Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
