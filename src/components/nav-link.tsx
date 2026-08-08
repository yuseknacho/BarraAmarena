"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "./clsx";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={clsx(
        "px-3 py-1.5 rounded-md text-sm whitespace-nowrap",
        active ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white"
      )}
    >
      {children}
    </Link>
  );
}
