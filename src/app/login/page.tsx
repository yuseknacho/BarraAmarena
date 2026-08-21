"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="min-h-screen flex flex-col items-center justify-center stage-lights p-4 gap-8">
      <Logo heightClass="h-16" />
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950/90 p-8 shadow-xl">
        <p className="text-sm text-white/50 text-center mb-6">
          Administración y estadísticas
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
            <p className="text-sm text-red-400">{state.error}</p>
          )}
          <Button type="submit" className="w-full py-2.5" disabled={pending}>
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
