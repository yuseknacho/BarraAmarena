import { requireUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { logoutAction } from "@/actions/auth";
import { NavLink } from "@/components/nav-link";

const cajeroLinks = [
  { href: "/pos", label: "Vender" },
  { href: "/caja", label: "Caja" },
];

const adminLinks = [
  { href: "/pos", label: "Vender" },
  { href: "/caja", label: "Caja" },
  { href: "/productos", label: "Productos" },
  { href: "/inventario", label: "Inventario" },
  { href: "/compras", label: "Compras" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/clientes", label: "Clientes" },
  { href: "/reportes", label: "Reportes" },
  { href: "/admin", label: "Administración" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const businessName = getSetting("business_name");
  const links = user.role === "admin" ? adminLinks : cajeroLinks;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white">
        <div className="flex items-center gap-6 px-4 h-12">
          <span className="font-bold whitespace-nowrap">{businessName}</span>
          <nav className="flex items-center gap-1 overflow-x-auto flex-1">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm text-gray-300">{user.fullName}</span>
            <form action={logoutAction}>
              <button className="text-sm text-gray-400 hover:text-white cursor-pointer">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
