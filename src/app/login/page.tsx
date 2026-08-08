"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button, Input, Label, Card } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Barra POS
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Sistema de ventas y gestión
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
