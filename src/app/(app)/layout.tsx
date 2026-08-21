import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { NavLink } from "@/components/nav-link";
import { Logo } from "@/components/logo";
import Link from "next/link";

const links = [
  { href: "/contabilidad", label: "Contabilidad Barra" },
  { href: "/estadisticas", label: "Estadísticas" },
  { href: "/admin", label: "Administración" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="bg-neutral-950 border-b border-white/10">
        <div className="flex items-center gap-4 px-4 h-14">
          <Link href="/estadisticas" className="shrink-0">
            <Logo heightClass="h-8" />
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto flex-1">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm text-white/60">{user.fullName}</span>
            <form action={logoutAction}>
              <button className="text-sm text-white/40 hover:text-white cursor-pointer">
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
