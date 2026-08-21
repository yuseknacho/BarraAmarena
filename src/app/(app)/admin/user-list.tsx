"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser, deleteUser } from "@/actions/users";
import { Button, Input, Label, Card, Th, Td, Badge } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface UserRow {
  id: number;
  username: string;
  fullName: string;
  active: boolean;
  email: string | null;
}

export function UserList({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteInfo, setDeleteInfo] = useState("");
  const [, startDelete] = useTransition();

  const confirmDelete = () => {
    const u = toDelete;
    if (!u) return;
    setToDelete(null);
    setDeleteError("");
    setDeleteInfo("");
    startDelete(async () => {
      const result = await deleteUser(u.id);
      if (result.error) setDeleteError(result.error);
      else {
        if (result.info) setDeleteInfo(result.info);
        router.refresh();
      }
    });
  };

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

      {deleteError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
          {deleteError}
        </p>
      )}
      {deleteInfo && (
        <p className="text-sm text-brand-light bg-brand/10 border border-brand/30 rounded-md px-3 py-2">
          {deleteInfo}
        </p>
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Usuario</Th>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((u) => (
              <tr key={u.id}>
                <Td className="font-medium">{u.username}</Td>
                <Td>{u.fullName}</Td>
                <Td className="text-white/60">{u.email ?? "—"}</Td>
                <Td>
                  <Badge color={u.active ? "green" : "red"}>
                    {u.active ? "activo" : "inactivo"}
                  </Badge>
                </Td>
                <Td className="text-right whitespace-nowrap">
                  <Button
                    variant="ghost"
                    onClick={() => { setEditing(u); setCreating(false); }}
                  >
                    Editar
                  </Button>
                  <button
                    onClick={() => { setDeleteError(""); setDeleteInfo(""); setToDelete(u); }}
                    className="ml-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-500/15 hover:text-red-400 cursor-pointer font-bold"
                    title={`Eliminar a "${u.fullName}"`}
                  >
                    ✕
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        title={`¿Eliminar al usuario "${toDelete?.fullName}"?`}
        message={
          "Ya no va a poder entrar al sistema. Si tiene ventas o cajas registradas, su nombre se conserva en el historial.\n\nEsta acción no se puede deshacer."
        }
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function CreateForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, undefined);
  const [showPass, setShowPass] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Usuario creado: mostrar las credenciales en claro para anotarlas
  if (state?.ok) {
    return (
      <Card className="border-brand/40 bg-brand/5">
        <h2 className="font-semibold mb-2">✅ Usuario creado</h2>
        <div className="rounded-lg bg-black/40 border border-white/10 p-4 mb-3 font-mono text-lg">
          <p>
            Usuario: <span className="font-bold text-brand-light">{username}</span>
          </p>
          <p>
            Contraseña:{" "}
            <span className="font-bold text-brand-light">{password}</span>
          </p>
        </div>
        <p className="text-sm text-white/50 mb-3">
          Anotá estos datos y pasáselos al empleado. La contraseña no se vuelve
          a mostrar (si se olvida, se le asigna una nueva desde Editar).
        </p>
        <Button onClick={onDone}>Listo</Button>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-semibold mb-3">Nuevo usuario</h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Usuario</Label>
          <Input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <Label>Nombre completo</Label>
          <Input name="fullName" required />
        </div>
        <div>
          <Label>Email (opcional)</Label>
          <Input name="email" type="email" placeholder="nombre@gmail.com" />
        </div>
        <div>
          <Label>Contraseña</Label>
          <div className="flex gap-2">
            <Input
              name="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPass((v) => !v)}
              title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? "🙈" : "👁"}
            </Button>
          </div>
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
  const [showPass, setShowPass] = useState(true);
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
          <Label>Email</Label>
          <Input name="email" type="email" defaultValue={user.email ?? ""} placeholder="nombre@gmail.com" />
        </div>
        <div>
          <Label>Nueva contraseña (vacío = no cambiar)</Label>
          <div className="flex gap-2">
            <Input name="password" type={showPass ? "text" : "password"} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPass((v) => !v)}
              title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPass ? "🙈" : "👁"}
            </Button>
          </div>
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
