"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/ui";

// Permite canjear con un lector físico 2D (que "tipea" la URL del QR) o
// pegando el código a mano.
export function TokenForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = () => {
    const raw = value.trim();
    if (!raw) return;
    // El QR contiene una URL: nos quedamos con el último tramo (el token)
    const token = raw.split("/").filter(Boolean).pop() ?? raw;
    router.push(`/canje/${token}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="flex gap-2 max-w-sm mx-auto"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Escaneá acá con el lector…"
        autoFocus
      />
      <Button type="submit">Buscar</Button>
    </form>
  );
}
