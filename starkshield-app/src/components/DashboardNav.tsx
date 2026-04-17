"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/transact", label: "Transact" },
  { href: "/dashboard/mcp", label: "MCP status" },
  { href: "/dashboard/learn", label: "Learn" },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
      {links.map((l) => {
        const active = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
        return (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active
              ? "bg-indigo text-white"
              : "text-gray-700 hover:bg-indigo/10 hover:text-indigo"
          }`}
          aria-current={active ? "page" : undefined}
        >
          {l.label}
        </Link>
        );
      })}
    </nav>
  );
}
