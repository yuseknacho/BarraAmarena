"use client";

import { useActionState, useRef } from "react";
import { adjustStock } from "@/actions/products";
import { Button, Input, Label, Select, Card } from "@/components/ui";

export function AdjustStockForm({
  products,
}: {
  products: { id: number; name: string; stock: number; unit: string }[];
}) {
  const [state, formAction, pending] = useActionState(adjustStock, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <h2 className="font-semibold mb-3">Ajuste manual de stock</h2>
      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <Label>Producto</Label>
          <Select name="productId" required defaultValue="">
            <option value="" disabled>
              Elegir producto…
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (actual: {p.stock} {p.unit})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Nuevo stock (conteo real)</Label>
          <Input name="newStock" type="number" step="any" min="0" required />
        </div>
        <div>
          <Label>Motivo</Label>
          <Input
            name="reason"
            placeholder="Ej: conteo físico, rotura…"
            required
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-400 lg:col-span-4">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-brand-light lg:col-span-4">
            Stock ajustado correctamente.
          </p>
        )}
        <div className="lg:col-span-4">
          <Button type="submit" disabled={pending}>
            Ajustar stock
          </Button>
        </div>
      </form>
    </Card>
  );
}
