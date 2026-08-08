"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidSale } from "@/actions/sales";

export function VoidSaleButton({ saleId }: { saleId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const onClick = () => {
    if (
      !confirm(
        "¿Anular esta venta? Se repone el stock de los productos. Esta acción no se puede deshacer."
      )
    )
      return;
    startTransition(async () => {
      const result = await voidSale(saleId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={onClick}
        disabled={pending}
        className="text-sm text-red-600 hover:underline cursor-pointer disabled:opacity-50"
      >
        {pending ? "Anulando…" : "Anular"}
      </button>
      {error && <span className="text-xs text-red-600 block">{error}</span>}
    </>
  );
}
