"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  updateProduct,
  createCategory,
  deleteCategory,
} from "@/actions/products";
import type { Product, Category } from "@/db/schema";
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
  initialQuery,
}: {
  products: Product[];
  categories: Category[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [search, setSearch] = useState(initialQuery);

  const catName = (id: number | null) =>
    categories.find((c) => c.id === id)?.name ?? "—";

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
          onDone={() => { setCreating(false); setEditing(null); }}
        />
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
                  <Td className="font-medium">{p.name}</Td>
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
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => { setEditing(p); setCreating(false); }}
                    >
                      Editar
                    </Button>
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
  onDone,
}: {
  product: Product | null;
  categories: Category[];
  onDone: () => void;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, undefined);
  if (state?.ok) onDone();

  return (
    <Card>
      <h2 className="font-semibold mb-3">
        {product ? `Editar: ${product.name}` : "Nuevo producto"}
      </h2>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {product && <input type="hidden" name="id" value={product.id} />}
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
        {!product && (
          <div>
            <Label>Stock inicial</Label>
            <Input name="stock" type="number" step="any" min="0" defaultValue="0" />
          </div>
        )}
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
    if (!confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
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
