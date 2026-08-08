"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/actions/purchases";
import { formatCents, pesosToCents } from "@/lib/money";
import { Button, Input, Label, Select, Card } from "@/components/ui";

interface ProductOption {
  id: number;
  name: string;
  costCents: number;
  stock: number;
  unit: string;
}

interface Line {
  productId: number | "";
  qty: string;
  unitCost: string;
}

const emptyLine: Line = { productId: "", qty: "", unitCost: "" };

export function PurchaseForm({
  suppliers,
  products,
}: {
  suppliers: { id: number; name: string }[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateLine = (i: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const onProductChange = (i: number, productId: number | "") => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, {
      productId,
      unitCost: p && p.costCents > 0 ? (p.costCents / 100).toFixed(2) : "",
    });
  };

  const totalCents = lines.reduce((a, l) => {
    const qty = parseFloat(l.qty) || 0;
    return a + Math.round(pesosToCents(l.unitCost || "0") * qty);
  }, 0);

  const reset = () => {
    setSupplierId("");
    setInvoiceRef("");
    setNotes("");
    setLines([{ ...emptyLine }]);
    setError("");
    setOpen(false);
  };

  const submit = async () => {
    setError("");
    if (supplierId === "") {
      setError("Elegí un proveedor.");
      return;
    }
    const items = lines
      .filter((l) => l.productId !== "" && parseFloat(l.qty) > 0)
      .map((l) => ({
        productId: l.productId as number,
        qty: parseFloat(l.qty),
        unitCostCents: pesosToCents(l.unitCost || "0"),
      }));
    if (items.length === 0) {
      setError("Agregá al menos un producto con cantidad.");
      return;
    }
    setSubmitting(true);
    const result = await createPurchase({
      supplierId,
      invoiceRef: invoiceRef.trim() || undefined,
      notes: notes.trim() || undefined,
      items,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    router.refresh();
  };

  if (!open) {
    return (
      <div>
        <Button onClick={() => setOpen(true)}>+ Registrar compra</Button>
      </div>
    );
  }

  return (
    <Card>
      <h2 className="font-semibold mb-3">Nueva compra</h2>
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <div>
          <Label>Proveedor</Label>
          <Select
            value={supplierId}
            onChange={(e) =>
              setSupplierId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Elegir proveedor…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Factura / Remito (opcional)</Label>
          <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} />
        </div>
        <div>
          <Label>Notas (opcional)</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="grid grid-cols-[1fr_100px_120px_120px_32px] gap-2 text-xs uppercase text-white/50 font-semibold">
          <span>Producto</span>
          <span>Cantidad</span>
          <span>Costo unit. ($)</span>
          <span className="text-right">Subtotal</span>
          <span></span>
        </div>
        {lines.map((l, i) => {
          const qty = parseFloat(l.qty) || 0;
          const lineTotal = Math.round(pesosToCents(l.unitCost || "0") * qty);
          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_100px_120px_120px_32px] gap-2 items-center"
            >
              <Select
                value={l.productId}
                onChange={(e) =>
                  onProductChange(
                    i,
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              >
                <option value="">Elegir producto…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (stock: {p.stock} {p.unit})
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="any"
                min="0"
                value={l.qty}
                onChange={(e) => updateLine(i, { qty: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={l.unitCost}
                onChange={(e) => updateLine(i, { unitCost: e.target.value })}
              />
              <span className="text-sm text-right">{formatCents(lineTotal)}</span>
              <button
                onClick={() =>
                  setLines((prev) =>
                    prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev
                  )
                }
                className="text-white/40 hover:text-red-400 cursor-pointer"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          );
        })}
        <Button
          variant="secondary"
          onClick={() => setLines((prev) => [...prev, { ...emptyLine }])}
        >
          + Agregar línea
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <span className="font-semibold">
          Total: <span className="text-lg">{formatCents(totalCents)}</span>
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Guardando…" : "Confirmar compra"}
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      <p className="text-xs text-white/40 mt-2">
        Al confirmar, el stock sube y el costo del producto se actualiza al
        costo de esta compra.
      </p>
    </Card>
  );
}
