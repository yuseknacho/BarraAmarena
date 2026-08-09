"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  createCategory,
  deleteCategory,
  deleteProduct,
} from "@/actions/products";
import type { Product, Category, ProductComponent } from "@/db/schema";
import { formatCents, formatQty } from "@/lib/money";
import {
  Button,
  Input,
  Label,
  Select,
  Card,
  Th,
  Td,
  Badge,
} from "@/components/ui";

export function ProductManager({
  products,
  categories,
  components,
  initialQuery,
}: {
  products: Product[];
  categories: Category[];
  components: ProductComponent[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [search, setSearch] = useState(initialQuery);
  const [deleteError, setDeleteError] = useState("");
  const [deleteInfo, setDeleteInfo] = useState("");
  const [, startDelete] = useTransition();

  const catName = (id: number | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

  const onDeleteProduct = (p: Product) => {
    if (
      !confirm(
        `⚠️ ¿Eliminar "${p.name}"?\n\nDesaparece de la lista y de la pantalla de venta. Si tiene ventas o compras registradas, el historial contable se conserva y lo mostrará como "(producto eliminado)".\n\nEsta acción NO se puede deshacer.`
      )
    )
      return;
    setDeleteError("");
    setDeleteInfo("");
    startDelete(async () => {
      const result = await deleteProduct(p.id);
      if (result.error) setDeleteError(result.error);
      else {
        if (result.info) setDeleteInfo(result.info);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/productos?q=${encodeURIComponent(search)}`);
          }}
          className="flex gap-2 flex-1 min-w-60"
        >
          <Input
            placeholder="Buscar por nombre o código de barras…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="secondary">Buscar</Button>
        </form>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          + Nuevo producto
        </Button>
        <Button variant="secondary" onClick={() => setShowCategoryForm((v) => !v)}>
          Categorías
        </Button>
      </div>

      {showCategoryForm && (
        <CategoryForm
          categories={categories}
          onDone={() => setShowCategoryForm(false)}
        />
      )}
      {(creating || editing) && (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          categories={categories}
          allProducts={products}
          initialComponents={
            editing
              ? components.filter((c) => c.productId === editing.id)
              : []
          }
          onDone={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {deleteError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
          {deleteError}
        </p>
      )}
      {deleteInfo && (
        <p className="text-sm text-brand-light bg-brand/10 border border-brand/30 rounded-md px-3 py-2">
          {deleteInfo}
        </p>
      )}

      <Card className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <Th>Código</Th>
              <Th>Nombre</Th>
              <Th>Categoría</Th>
              <Th className="text-right">Costo</Th>
              <Th className="text-right">Precio</Th>
              <Th className="text-right">Stock</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.length === 0 && (
              <tr>
                <Td colSpan={8} className="text-center text-white/40 py-8">
                  No hay productos. Creá el primero con “+ Nuevo producto”.
                </Td>
              </tr>
            )}
            {products.map((p) => {
              const low = p.minStock != null && p.stock <= p.minStock;
              return (
                <tr key={p.id} className={!p.active ? "opacity-50" : ""}>
                  <Td className="font-mono text-xs">{p.barcode ?? "—"}</Td>
                  <Td className="font-medium">
                    {p.name}
                    {p.isCombo && (
                      <span className="ml-2">
                        <Badge color="yellow">COMBO</Badge>
                      </span>
                    )}
                  </Td>
                  <Td>{catName(p.categoryId)}</Td>
                  <Td className="text-right">{formatCents(p.costCents)}</Td>
                  <Td className="text-right font-medium">
                    {formatCents(p.priceCents)}
                  </Td>
                  <Td className="text-right">
                    <span className={low ? "text-red-400 font-semibold" : ""}>
                      {formatQty(p.stock, p.unit)}
                    </span>
                    {low && <Badge color="red">bajo</Badge>}
                  </Td>
                  <Td>
                    <Badge color={p.active ? "green" : "red"}>
                      {p.active ? "activo" : "inactivo"}
                    </Badge>
                  </Td>
                  <Td className="text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      onClick={() => { setEditing(p); setCreating(false); }}
                    >
                      Editar
                    </Button>
                    <button
                      onClick={() => onDeleteProduct(p)}
                      className="ml-1 px-2 py-1 rounded-md text-red-500 hover:bg-red-500/15 hover:text-red-400 cursor-pointer font-bold"
                      title={`Eliminar "${p.name}" definitivamente`}
                    >
                      ✕
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  allProducts,
  initialComponents,
  onDone,
}: {
  product: Product | null;
  categories: Category[];
  allProducts: Product[];
  initialComponents: ProductComponent[];
  onDone: () => void;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [isCombo, setIsCombo] = useState(product?.isCombo ?? false);
  const [comboRows, setComboRows] = useState<{ productId: number | ""; qty: string }[]>(
    initialComponents.length > 0
      ? initialComponents.map((c) => ({
          productId: c.componentProductId,
          qty: String(c.qty),
        }))
      : [
          { productId: "", qty: "1" },
          { productId: "", qty: "1" },
        ]
  );
  if (state?.ok) onDone();

  // Solo productos comunes pueden formar parte de un combo
  const componentOptions = allProducts.filter(
    (p) => !p.isCombo && p.active && p.id !== product?.id
  );
  const componentsJson = JSON.stringify(
    comboRows
      .filter((r) => r.productId !== "" && parseFloat(r.qty) > 0)
      .map((r) => ({ productId: r.productId as number, qty: parseFloat(r.qty) }))
  );

  return (
    <Card>
      <h2 className="font-semibold mb-3">
        {product ? `Editar: ${product.name}` : "Nuevo producto"}
      </h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {product && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="components" value={componentsJson} />
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
          <input
            id="p-combo"
            type="checkbox"
            name="isCombo"
            checked={isCombo}
            onChange={(e) => setIsCombo(e.target.checked)}
            disabled={!!product && product.isCombo}
            className="h-4 w-4"
          />
          <label htmlFor="p-combo" className="text-sm font-semibold">
            COMBO{" "}
            <span className="font-normal text-white/50">
              (agrupa 2 o más productos ya cargados; al venderlo se descuenta el
              stock de cada uno)
            </span>
          </label>
        </div>
        <div className="lg:col-span-2">
          <Label>Nombre</Label>
          <Input name="name" defaultValue={product?.name} required autoFocus />
        </div>
        <div>
          <Label>Código de barras</Label>
          <Input name="barcode" defaultValue={product?.barcode ?? ""} />
        </div>
        <div>
          <Label>Categoría</Label>
          <Select name="categoryId" defaultValue={product?.categoryId ?? ""}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
        {!isCombo && (
          <div>
            <Label>Precio de costo ($)</Label>
            <Input
              name="cost"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product ? product.costCents / 100 : ""}
            />
          </div>
        )}
        <div>
          <Label>Precio de venta ($)</Label>
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product ? product.priceCents / 100 : ""}
            required
          />
        </div>
        <div>
          <Label>IVA % (opcional)</Label>
          <Input
            name="taxRate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={product?.taxRate ?? ""}
          />
        </div>
        <div>
          <Label>Unidad</Label>
          <Select name="unit" defaultValue={product?.unit ?? "u"}>
            <option value="u">Unidad</option>
            <option value="kg">Kilogramo</option>
            <option value="lt">Litro</option>
            <option value="mt">Metro</option>
          </Select>
        </div>
        {!product && !isCombo && (
          <div>
            <Label>Stock inicial</Label>
            <Input name="stock" type="number" step="any" min="0" defaultValue="0" />
          </div>
        )}
        {!isCombo && (
          <div>
            <Label>Stock mínimo (alerta)</Label>
            <Input
              name="minStock"
              type="number"
              step="any"
              min="0"
              defaultValue={product?.minStock ?? ""}
            />
          </div>
        )}
        {isCombo && (
          <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-yellow-400">
              Productos que incluye el combo
            </p>
            {comboRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Select
                    value={row.productId}
                    onChange={(e) =>
                      setComboRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i
                            ? {
                                ...r,
                                productId:
                                  e.target.value === "" ? "" : Number(e.target.value),
                              }
                            : r
                        )
                      )
                    }
                  >
                    <option value="">Elegir producto…</option>
                    {componentOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.stock} {p.unit})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24 shrink-0">
                  <Input
                    type="number"
                    step="any"
                    min="0.001"
                    value={row.qty}
                    onChange={(e) =>
                      setComboRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i ? { ...r, qty: e.target.value } : r
                        )
                      )
                    }
                    className="text-center"
                    title="Cantidad"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setComboRows((prev) =>
                      prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev
                    )
                  }
                  className="text-white/40 hover:text-red-400 cursor-pointer px-1"
                  title="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setComboRows((prev) => [...prev, { productId: "", qty: "1" }])
              }
            >
              + Agregar producto
            </Button>
            <p className="text-xs text-white/40">
              El costo del combo se calcula solo (suma de los costos). Si al
              vender no hay stock de algún componente, la venta se bloquea.
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          <Label>Foto (para la pantalla de venta)</Label>
          <div className="flex items-center gap-3">
            {product?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/img/${product.image}`}
                alt={product.name}
                className="h-14 w-14 rounded-md object-cover border border-white/15"
              />
            )}
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20 file:cursor-pointer"
            />
          </div>
          {product?.image && (
            <label className="flex items-center gap-2 mt-2 text-sm text-white/60">
              <input type="checkbox" name="removeImage" className="h-4 w-4" />
              Quitar la foto actual
            </label>
          )}
        </div>
        {product && (
          <div className="flex items-center gap-2 pt-6">
            <input
              id="p-active"
              type="checkbox"
              name="active"
              defaultChecked={product.active}
              className="h-4 w-4"
            />
            <label htmlFor="p-active" className="text-sm">Activo</label>
          </div>
        )}
        {state?.error && (
          <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-4">
            {state.error}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={pending}>
            {product ? "Guardar" : "Crear"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CategoryForm({
  categories,
  onDone,
}: {
  categories: Category[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(createCategory, undefined);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, startDelete] = useTransition();
  const router = useRouter();

  const onDelete = (c: Category) => {
    if (
      !confirm(
        `¿Eliminar la categoría "${c.name}"?\n\nLos productos que la usen no se borran: quedan "Sin categoría".`
      )
    )
      return;
    setDeleteError("");
    startDelete(async () => {
      const result = await deleteCategory(c.id);
      if (result.error) setDeleteError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <h2 className="font-semibold mb-3">Categorías</h2>
        <Button variant="ghost" onClick={onDone}>Cerrar</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.length === 0 && (
          <span className="text-sm text-white/40">Sin categorías todavía.</span>
        )}
        {categories.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 text-sky-400 px-2.5 py-0.5 text-xs font-medium"
          >
            {c.name}
            <button
              onClick={() => onDelete(c)}
              disabled={deleting}
              className="text-sky-400/60 hover:text-red-400 cursor-pointer disabled:opacity-40"
              title={`Eliminar "${c.name}"`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <form action={formAction} className="flex gap-2 max-w-sm">
        <Input name="name" placeholder="Nueva categoría…" required />
        <Button type="submit" disabled={pending}>Agregar</Button>
      </form>
      {state?.error && <p className="text-sm text-red-400 mt-2">{state.error}</p>}
      {deleteError && <p className="text-sm text-red-400 mt-2">{deleteError}</p>}
    </Card>
  );
}
