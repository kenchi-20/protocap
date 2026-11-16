"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/student", label: "Student" },
  { href: "/parent", label: "Parent" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/scanner", label: "Scanner" },
];

export function AppHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const path = usePathname();
  return (
    <header className="border-b border-maroon/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-maroon">{eyebrow}</p>}
            <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-slate-600">{subtitle}</p>}
          </div>
          <p className="text-xs font-medium text-slate-500">University of San Agustin · Junior High</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {links.map((link) => {
            const active = link.href === "/" ? path === "/" : path === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? "bg-maroon text-white" : "text-slate-600 hover:bg-maroon-soft"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
