"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { Logo } from "@/components/logo";

const GOOGLE_ERRORS: Record<string, string> = {
  "google-no-habilitada":
    "Esa cuenta de Google no está habilitada. Un administrador tiene que cargar tu email en Administración → Usuarios.",
  "google-unverified": "El email de esa cuenta de Google no está verificado.",
  "google-state": "El ingreso con Google expiró. Probá de nuevo.",
  "google-config": "El ingreso con Google no está configurado en este servidor.",
  google: "No se pudo completar el ingreso con Google. Probá de nuevo.",
};

export function LoginForm({
  googleEnabled,
  error,
}: {
  googleEnabled: boolean;
  error?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, {});
  const googleError = error ? GOOGLE_ERRORS[error] : undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center stage-lights p-4 gap-8">
      <Logo heightClass="h-16" />
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950/90 p-8 shadow-xl">
        <p className="text-sm text-white/50 text-center mb-6">
          Administración y estadísticas
        </p>
        {googleEnabled && (
          <>
            <a
              href="/api/auth/google?mode=login"
              className="flex items-center justify-center gap-3 w-full rounded-md bg-white text-gray-900 font-semibold py-2.5 hover:bg-gray-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/>
                <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.9-6.1z"/>
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
              </svg>
              Ingresar con Google
            </a>
            <div className="flex items-center gap-3 my-5 text-xs text-white/30">
              <div className="flex-1 border-t border-white/10" />
              o con usuario y contraseña
              <div className="flex-1 border-t border-white/10" />
            </div>
          </>
        )}
        {googleError && (
          <p className="text-sm text-red-400 mb-4 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
            {googleError}
          </p>
        )}
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
