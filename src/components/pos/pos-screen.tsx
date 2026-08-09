"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSale } from "@/actions/sales";
import { saveProductOrder } from "@/actions/products";
import { formatCents, pesosToCents } from "@/lib/money";
import { Button, Select, Card } from "@/components/ui";
import { PaymentModal } from "./payment-modal";

export interface PosProduct {
  id: number;
  barcode: string | null;
  name: string;
  priceCents: number;
  stock: number;
  unit: string;
  image: string | null;
  categoryId: number | null;
}

interface CartLine extends PosProduct {
  qty: number;
}

export function PosScreen({
  terminalName,
  sellerName,
  isAdmin,
  customers,
  products,
  categories,
}: {
  terminalName: string;
  sellerName: string;
  isAdmin: boolean;
  customers: { id: number; name: string }[];
  products: PosProduct[];
  categories: { id: number; name: string }[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<number | "todos">("todos");
  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [paying, setPaying] = useState(false);
  const [lastSale, setLastSale] = useState<{ saleId: number; docNumber: number } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Modo "Ordenar": arrastrar los cuadrados para acomodarlos (solo Super Admin)
  const router = useRouter();
  const [ordering, setOrdering] = useState(false);
  const [orderList, setOrderList] = useState<PosProduct[]>(products);
  const [savingOrder, startSaveOrder] = useTransition();
  const dragId = useRef<number | null>(null);
  useEffect(() => {
    if (!ordering) setOrderList(products);
  }, [products, ordering]);

  const moveProduct = (fromId: number, toId: number) => {
    if (fromId === toId) return;
    setOrderList((prev) => {
      const list = [...prev];
      const from = list.findIndex((p) => p.id === fromId);
      const to = list.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0) return prev;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return list;
    });
  };

  const saveOrder = () => {
    startSaveOrder(async () => {
      const result = await saveProductOrder(orderList.map((p) => p.id));
      if (result.error) setError(result.error);
      else {
        setOrdering(false);
        router.refresh();
      }
    });
  };

  const subtotalCents = cart.reduce(
    (a, l) => a + Math.round(l.priceCents * l.qty),
    0
  );
  const discountCents = Math.min(pesosToCents(discount || "0"), subtotalCents);
  const totalCents = subtotalCents - discountCents;

  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = ordering ? orderList : products;
    return source.filter((p) => {
      if (categoryId !== "todos" && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode ?? "").startsWith(q)
      );
    });
  }, [products, orderList, ordering, query, categoryId]);

  const addProduct = useCallback((p: PosProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setError("");
  }, []);

  // Enter en el buscador: código de barras exacto o único resultado
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = query.trim();
      if (!value) {
        if (cart.length > 0) setPaying(true);
        return;
      }
      const byCode = products.find((p) => p.barcode === value);
      if (byCode) {
        addProduct(byCode);
        setQuery("");
        return;
      }
      if (visibleProducts.length === 1) {
        addProduct(visibleProducts[0]);
        setQuery("");
        return;
      }
      if (visibleProducts.length === 0) setError(`No se encontró “${value}”.`);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

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

  const removeLine = (id: number) =>
    setCart((prev) => prev.filter((l) => l.id !== id));

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
          <h2 className="font-display text-2xl tracking-wide uppercase">
            Venta registrada
          </h2>
          <p className="text-white/50 mt-1">
            Ticket N° {String(lastSale.docNumber).padStart(8, "0")}
          </p>
          <p className="text-3xl font-bold mt-3 text-brand-light">
            {formatCents(totalCents)}
          </p>
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
    <div className="flex flex-row gap-3 h-[calc(100vh-8rem)] min-h-120">
      {/* Pedido actual — siempre a la izquierda */}
      <div className="w-72 md:w-80 lg:w-96 shrink-0 flex flex-col gap-3 min-h-0">
        <div className="rounded-xl border border-white/10 bg-neutral-950 flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-2">
            <h2 className="font-display tracking-wide uppercase">Pedido</h2>
            <span className="text-xs text-white/40 text-right truncate">
              Vende: <span className="text-brand-light font-semibold">{sellerName}</span>
              {" · "}
              {terminalName}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {cart.length === 0 && (
              <p className="text-center text-white/30 text-sm py-10 px-4">
                Tocá un producto para agregarlo al pedido.
              </p>
            )}
            {cart.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-2 px-3 py-2 border-b border-white/5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.name}</p>
                  <p className="text-xs text-white/40">
                    {formatCents(l.priceCents)} c/u
                    {l.qty > l.stock && (
                      <span className="text-red-400 ml-2">⚠ stock: {l.stock}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 cursor-pointer disabled:opacity-40"
                    onClick={() => updateQty(l.id, l.qty - 1)}
                    disabled={l.qty <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={l.qty}
                    onChange={(e) => updateQty(l.id, Number(e.target.value))}
                    className="w-12 text-center rounded border border-white/15 bg-white/5 py-1 text-sm [color-scheme:dark]"
                  />
                  <button
                    className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
                    onClick={() => updateQty(l.id, l.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">
                  {formatCents(Math.round(l.priceCents * l.qty))}
                </span>
                <button
                  onClick={() => removeLine(l.id)}
                  className="text-white/30 hover:text-red-400 cursor-pointer px-1"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-3 space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-white/60">
              <span>Descuento ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 text-right rounded border border-white/15 bg-white/5 py-1 px-2 text-sm [color-scheme:dark]"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-display tracking-wide uppercase">Total</span>
              <span className="text-3xl font-bold text-brand-light">
                {formatCents(totalCents)}
              </span>
            </div>
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
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                disabled={cart.length === 0}
                onClick={() => {
                  if (confirm("¿Vaciar el pedido?")) newSale();
                }}
              >
                Anular
              </Button>
              <Button
                className="py-3"
                disabled={cart.length === 0}
                onClick={() => setPaying(true)}
              >
                Cobrar (F9)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Catálogo con fotos */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Escaneá un código de barras o buscá por nombre… (Enter agrega)"
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-base text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand"
          autoFocus
        />

        <div className="flex gap-2 items-center">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0">
            <CategoryButton
              active={categoryId === "todos"}
              onClick={() => setCategoryId("todos")}
            >
              Todos
            </CategoryButton>
            {categories.map((c) => (
              <CategoryButton
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
              >
                {c.name}
              </CategoryButton>
            ))}
          </div>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              {!ordering ? (
                <Button variant="secondary" onClick={() => setOrdering(true)}>
                  ↕ Ordenar
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOrdering(false);
                      setOrderList(products);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveOrder} disabled={savingOrder}>
                    {savingOrder ? "Guardando…" : "Guardar orden"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {ordering && (
          <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-md px-3 py-2">
            Modo ordenar: arrastrá los cuadrados a la posición que quieras y
            tocá &quot;Guardar orden&quot;. Mientras tanto no se agregan productos al
            pedido.
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {visibleProducts.length === 0 ? (
            <p className="text-center text-white/30 py-16">
              No hay productos en esta vista.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-1.5">
              {visibleProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (ordering) return;
                    addProduct(p);
                    focusInput();
                  }}
                  draggable={ordering}
                  onDragStart={() => {
                    dragId.current = p.id;
                  }}
                  onDragEnter={() => {
                    if (ordering && dragId.current !== null)
                      moveProduct(dragId.current, p.id);
                  }}
                  onDragOver={(e) => {
                    if (ordering) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (ordering) e.preventDefault();
                    dragId.current = null;
                  }}
                  onDragEnd={() => {
                    dragId.current = null;
                  }}
                  className={`group relative aspect-square rounded-lg overflow-hidden border text-left transition ${
                    ordering
                      ? "border-yellow-500/50 ring-1 ring-yellow-500/30 cursor-move"
                      : "border-white/10 bg-neutral-900 cursor-pointer hover:border-brand hover:ring-2 hover:ring-brand/50 active:scale-95"
                  }`}
                >
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/img/${p.image}`}
                      alt={p.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-1.5">
                      <span className="text-center text-xs font-semibold text-white/60 leading-tight">
                        {p.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-4 pb-1 px-1.5">
                    {p.image && (
                      <p className="text-[10px] font-medium leading-tight truncate">
                        {p.name}
                      </p>
                    )}
                    <p className="text-xs font-bold text-brand-light leading-tight">
                      {formatCents(p.priceCents)}
                      {p.stock <= 0 && (
                        <span className="text-red-400 text-[10px] font-normal ml-1">
                          sin stock
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap cursor-pointer transition ${
        active
          ? "bg-brand text-black"
          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
