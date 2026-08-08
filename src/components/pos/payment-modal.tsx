"use client";

import { useMemo, useState } from "react";
import { formatCents, pesosToCents } from "@/lib/money";
import { Button, Input } from "@/components/ui";

type Method = "efectivo" | "tarjeta" | "transferencia" | "otro";

const METHODS: { key: Method; label: string }[] = [
  { key: "efectivo", label: "💵 Efectivo" },
  { key: "tarjeta", label: "💳 Tarjeta" },
  { key: "transferencia", label: "📲 Transferencia" },
  { key: "otro", label: "Otro" },
];

export function PaymentModal({
  totalCents,
  onConfirm,
  onClose,
}: {
  totalCents: number;
  onConfirm: (
    payments: { method: Method; amountCents: number; reference?: string }[]
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [amounts, setAmounts] = useState<Record<Method, string>>({
    efectivo: "",
    tarjeta: "",
    transferencia: "",
    otro: "",
  });
  const [received, setReceived] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const paidCents = useMemo(
    () =>
      (Object.keys(amounts) as Method[]).reduce(
        (a, m) => a + pesosToCents(amounts[m] || "0"),
        0
      ),
    [amounts]
  );
  const remainingCents = totalCents - paidCents;

  const cashCents = pesosToCents(amounts.efectivo || "0");
  const receivedCents = pesosToCents(received || "0");
  const changeCents = receivedCents > 0 ? receivedCents - cashCents : 0;

  const setFull = (method: Method) => {
    const cleared: Record<Method, string> = {
      efectivo: "",
      tarjeta: "",
      transferencia: "",
      otro: "",
    };
    cleared[method] = (totalCents / 100).toFixed(2);
    setAmounts(cleared);
    if (method === "efectivo") setReceived("");
  };

  const setAmount = (method: Method, value: string) => {
    setAmounts((prev) => ({ ...prev, [method]: value }));
  };

  const confirm = async () => {
    if (remainingCents !== 0 || submitting) return;
    setSubmitting(true);
    const payments = (Object.keys(amounts) as Method[])
      .map((m) => ({
        method: m,
        amountCents: pesosToCents(amounts[m] || "0"),
        reference:
          m !== "efectivo" && reference.trim() ? reference.trim() : undefined,
      }))
      .filter((p) => p.amountCents > 0);
    await onConfirm(payments);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && remainingCents === 0) {
            e.preventDefault();
            confirm();
          }
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Cobrar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            ✕ (Esc)
          </button>
        </div>

        <p className="text-center text-3xl font-bold mb-4">
          {formatCents(totalCents)}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {METHODS.map((m) => (
            <Button
              key={m.key}
              variant="secondary"
              onClick={() => setFull(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <div className="space-y-2 mb-4">
          {METHODS.map((m) => (
            <div key={m.key} className="flex items-center gap-2">
              <span className="w-32 text-sm text-gray-600">{m.label}</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amounts[m.key]}
                onChange={(e) => setAmount(m.key, e.target.value)}
                placeholder="0.00"
                className="text-right"
              />
            </div>
          ))}
        </div>

        {cashCents > 0 && (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3 mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-32 text-sm text-gray-600">Recibido ($)</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder={(cashCents / 100).toFixed(2)}
                className="text-right"
                autoFocus
              />
            </div>
            {receivedCents > 0 && (
              <p
                className={`text-right font-semibold ${
                  changeCents < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {changeCents < 0
                  ? `Falta: ${formatCents(-changeCents)}`
                  : `Vuelto: ${formatCents(changeCents)}`}
              </p>
            )}
          </div>
        )}

        {(pesosToCents(amounts.tarjeta || "0") > 0 ||
          pesosToCents(amounts.transferencia || "0") > 0) && (
          <div className="flex items-center gap-2 mb-4">
            <span className="w-32 text-sm text-gray-600">Referencia</span>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° operación (opcional)"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">Restante</span>
          <span
            className={`font-semibold ${
              remainingCents === 0
                ? "text-green-700"
                : remainingCents < 0
                  ? "text-red-600"
                  : "text-gray-900"
            }`}
          >
            {remainingCents < 0
              ? `Sobra ${formatCents(-remainingCents)}`
              : formatCents(remainingCents)}
          </span>
        </div>

        <Button
          className="w-full py-3"
          disabled={remainingCents !== 0 || submitting || changeCents < 0}
          onClick={confirm}
        >
          {submitting ? "Registrando…" : "Confirmar venta (Enter)"}
        </Button>
      </div>
    </div>
  );
}
