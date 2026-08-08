import { requireAdmin } from "@/lib/auth";
import { Card, PageTitle } from "@/components/ui";
import Link from "next/link";

const sections = [
  {
    href: "/admin/usuarios",
    title: "Usuarios",
    desc: "Crear cajeros y administradores, cambiar contraseñas.",
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
            <Card className="hover:border-blue-400 transition-colors h-full">
              <h2 className="font-semibold text-gray-900">{s.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
