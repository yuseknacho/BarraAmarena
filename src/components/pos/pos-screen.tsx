"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchProducts, findByBarcode, createSale } from "@/actions/sales";
import { formatCents, pesosToCents } from "@/lib/money";
import { Button, Input, Select, Card } from "@/components/ui";
import { PaymentModal } from "./payment-modal";

interface FoundProduct {
  id: number;
  barcode: string | null;
  name: string;
  priceCents: number;
  stock: number;
  unit: string;
}

export interface CartLine extends FoundProduct {
  qty: number;
}

export function PosScreen({
  terminalName,
  customers,
}: {
  terminalName: string;
  customers: { id: number; name: string }[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundProduct[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [paying, setPaying] = useState(false);
  const [lastSale, setLastSale] = useState<{ saleId: number; docNumber: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotalCents = cart.reduce(
    (a, l) => a + Math.round(l.priceCents * l.qty),
    0
  );
  const discountCents = Math.min(pesosToCents(discount || "0"), subtotalCents);
  const totalCents = subtotalCents - discountCents;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const addProduct = useCallback((p: FoundProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setQuery("");
    setResults([]);
    setHighlighted(0);
    setError("");
  }, []);

  // Búsqueda incremental con debounce
  const onQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const found = await searchProducts(value);
      setResults(found);
      setHighlighted(0);
    }, 150);
  };

  // Enter en el buscador: primero código de barras exacto, después selección
  const onSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = query.trim();
      if (!value) {
        if (cart.length > 0) setPaying(true);
        return;
      }
      const byCode = await findByBarcode(value);
      if (byCode) {
        addProduct(byCode);
        return;
      }
      if (results.length > 0) {
        addProduct(results[Math.min(highlighted, results.length - 1)]);
        return;
      }
      const found = await searchProducts(value);
      if (found.length === 1) addProduct(found[0]);
      else if (found.length > 1) setResults(found);
      else setError(`No se encontró “${value}”.`);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
    }
  };

  // Atajos globales
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && !lastSale) setPaying(true);
      } else if (e.key === "Escape" && paying) {
        setPaying(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length, paying, lastSale]);

  useEffect(() => {
    if (!paying && !lastSale) focusInput();
  }, [paying, lastSale, focusInput]);

  const updateQty = (id: number, qty: number) => {
    if (!Number.isFinite(qty) || qty <= 0) return;
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  };

  const removeLine = (id: number) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
    focusInput();
  };

  const confirmSale = async (
    payments: { method: "efectivo" | "tarjeta" | "transferencia" | "otro"; amountCents: number; reference?: string }[]
  ) => {
    const result = await createSale({
      items: cart.map((l) => ({ productId: l.id, qty: l.qty, discountCents: 0 })),
      discountCents,
      payments,
      customerId: customerId === "" ? null : customerId,
    });
    if (!result.ok) {
      setError(result.error);
      setPaying(false);
      return;
    }
    setPaying(false);
    setLastSale(result);
    window.open(`/print/ticket/${result.saleId}?auto=1`, "_blank", "width=400,height=600");
  };

  const newSale = () => {
    setCart([]);
    setDiscount("");
    setCustomerId("");
    setLastSale(null);
    setError("");
    focusInput();
  };

  if (lastSale) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <Card className="py-10">
          <p className="text-5xl mb-3">✅</p>
          <h2 className="text-2xl font-bold">Venta registrada</h2>
          <p className="text-gray-500 mt-1">
            Ticket N° {String(lastSale.docNumber).padStart(8, "0")}
          </p>
          <p className="text-3xl font-bold mt-3">{formatCents(totalCents)}</p>
          <div className="flex gap-2 justify-center mt-6">
            <Button
              variant="secondary"
              onClick={() =>
                window.open(
                  `/print/ticket/${lastSale.saleId}?auto=1`,
                  "_blank",
                  "width=400,height=600"
                )
              }
            >
              🖨 Reimprimir
            </Button>
            <Button onClick={newSale} autoFocus>
              Nueva venta (Enter)
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Columna izquierda: búsqueda + carrito */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Escaneá un código de barras o buscá por nombre… (Enter)"
            className="text-lg py-3"
            autoFocus
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={r.id}
                  className={`w-full text-left px-3 py-2 text-sm flex justify-between gap-2 cursor-pointer ${
                    i === highlighted ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => {
                    addProduct(r);
                    focusInput();
                  }}
                >
                  <span>
                    {r.name}
                    {r.barcode && (
                      <span className="text-gray-400 ml-2 font-mono text-xs">
                        {r.barcode}
                      </span>
                    )}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    {formatCents(r.priceCents)}
                    <span
                      className={`ml-2 text-xs ${r.stock <= 0 ? "text-red-500" : "text-gray-400"}`}
                    >
                      stock: {r.stock}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-3 py-2">Producto</th>
                <th className="text-center px-2 py-2 w-36">Cantidad</th>
                <th className="text-right px-3 py-2 w-28">Precio</th>
                <th className="text-right px-3 py-2 w-28">Total</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-12">
                    Carrito vacío. Escaneá o buscá un producto para empezar.
                  </td>
                </tr>
              )}
              {cart.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-sm">{l.name}</p>
                    {l.qty > l.stock && (
                      <p className="text-xs text-red-500">
                        ⚠️ stock disponible: {l.stock}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="secondary"
                        className="px-2 py-1"
                        onClick={() => updateQty(l.id, l.qty - 1)}
                        disabled={l.qty <= 1}
                      >
                        −
                      </Button>
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        value={l.qty}
                        onChange={(e) => updateQty(l.id, Number(e.target.value))}
                        className="w-16 text-center rounded-md border border-gray-300 py-1 text-sm"
                      />
                      <Button
                        variant="secondary"
                        className="px-2 py-1"
                        onClick={() => updateQty(l.id, l.qty + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm">
                    {formatCents(l.priceCents)}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium">
                    {formatCents(Math.round(l.priceCents * l.qty))}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => removeLine(l.id)}
                      className="text-gray-400 hover:text-red-600 cursor-pointer"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Columna derecha: totales */}
      <div className="lg:w-80 space-y-3">
        <Card>
          <p className="text-xs text-gray-500 uppercase mb-1">{terminalName}</p>
          <div className="flex justify-between text-sm py-1">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
          <div className="flex justify-between items-center text-sm py-1">
            <span className="text-gray-500">Descuento ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 text-right rounded-md border border-gray-300 py-1 px-2 text-sm"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between items-center border-t border-gray-200 mt-2 pt-2">
            <span className="font-semibold">TOTAL</span>
            <span className="text-2xl font-bold">{formatCents(totalCents)}</span>
          </div>
        </Card>

        <Card>
          <label className="text-xs text-gray-500 uppercase block mb-1">
            Cliente (opcional)
          </label>
          <Select
            value={customerId}
            onChange={(e) =>
              setCustomerId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Consumidor final</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Card>

        <Button
          className="w-full py-4 text-lg"
          disabled={cart.length === 0}
          onClick={() => setPaying(true)}
        >
          Cobrar (F9)
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={cart.length === 0}
          onClick={() => {
            if (confirm("¿Vaciar el carrito?")) newSale();
          }}
        >
          Cancelar venta
        </Button>
      </div>

      {paying && (
        <PaymentModal
          totalCents={totalCents}
          onConfirm={confirmSale}
          onClose={() => {
            setPaying(false);
            focusInput();
          }}
        />
      )}
    </div>
  );
}
