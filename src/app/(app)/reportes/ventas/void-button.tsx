"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voidSale } from "@/actions/sales";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function VoidSaleButton({ saleId }: { saleId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const onConfirm = () => {
    setConfirming(false);
    startTransition(async () => {
      const result = await voidSale(saleId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="text-sm text-red-400 hover:underline cursor-pointer disabled:opacity-50"
      >
        {pending ? "Anulando…" : "Anular"}
      </button>
      {error && <span className="text-xs text-red-400 block">{error}</span>}

      <ConfirmDialog
        open={confirming}
        title="¿Anular esta venta?"
        message="Se repone el stock de los productos vendidos. Esta acción no se puede deshacer."
        confirmLabel="Sí, anular"
        onConfirm={onConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
