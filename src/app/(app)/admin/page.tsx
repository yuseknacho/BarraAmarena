import { requireAdmin } from "@/lib/auth";
import { Card, PageTitle, PageHelp } from "@/components/ui";
import Link from "next/link";

const sections = [
  {
    href: "/panel",
    title: "Panel de control",
    desc: "Recaudación en vivo y control por caja.",
  },
  {
    href: "/pos",
    title: "Vender",
    desc: "Pantalla de venta con el catálogo y el pedido.",
  },
  {
    href: "/caja",
    title: "Caja",
    desc: "Apertura, movimientos y cierre con arqueo.",
  },
  {
    href: "/canje",
    title: "Entregas",
    desc: "Canje de pedidos escaneando el QR del ticket.",
  },
  {
    href: "/productos",
    title: "Productos",
    desc: "Catálogo, precios, fotos, categorías y combos.",
  },
  {
    href: "/inventario",
    title: "Inventario",
    desc: "Stock, alertas de mínimo y ajustes.",
  },
  {
    href: "/compras",
    title: "Compras",
    desc: "Compras a proveedores que suben el stock.",
  },
  {
    href: "/admin/usuarios",
    title: "Usuarios",
    desc: "Crear cajeros, barman y administradores; contraseñas.",
  },
  {
    href: "/admin/terminales",
    title: "Terminales",
    desc: "Puestos de venta: crear cajas y vincular dispositivos.",
  },
  {
    href: "/admin/configuracion",
    title: "Configuración",
    desc: "Nombre del negocio, ticket, respaldos de la base de datos.",
  },
];

export default async function AdminPage() {
  await requireAdmin();
  return (
    <div>
      <PageTitle>Administración</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="hover:border-brand/50 transition-colors h-full">
              <h2 className="font-semibold text-white">{s.title}</h2>
              <p className="text-sm text-white/50 mt-1">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
      <PageHelp>La configuración del sistema: usuarios y contraseñas, las terminales (cajas) y qué computadora usa cada una, los datos del negocio, el formato del ticket y los respaldos de la base de datos.</PageHelp>
    </div>
  );
}
