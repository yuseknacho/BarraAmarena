"use client";

import { Button } from "./ui";

/**
 * Confirmación propia del sistema. Reemplaza al confirm() del navegador,
 * que puede quedar bloqueado por "no permitir más diálogos" y hace que
 * los botones mueran en silencio.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Sí, eliminar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-950 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-lg mb-1">⚠️ {title}</h3>
        <p className="text-sm text-white/60 whitespace-pre-line mb-4">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} autoFocus>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
