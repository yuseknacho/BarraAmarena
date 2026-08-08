"use client";

import { useActionState } from "react";
import { createTerminal } from "@/actions/terminals";
import { Button, Input, Card } from "@/components/ui";

export function NewTerminalForm() {
  const [state, formAction, pending] = useActionState(createTerminal, undefined);

  return (
    <Card>
      <form action={formAction} className="flex gap-2 max-w-md items-start">
        <div className="flex-1">
          <Input name="name" placeholder="Nombre, ej: Caja 1" required />
          {state?.error && (
            <p className="text-sm text-red-400 mt-1">{state.error}</p>
          )}
        </div>
        <Button type="submit" disabled={pending}>
          + Crear terminal
        </Button>
      </form>
    </Card>
  );
}
