"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, Bookmark, CalendarDays, Compass, Sun, UserRound } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Hoje", icon: Sun },
  { href: "/grade", label: "Grade", icon: CalendarDays },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/minha-lista", label: "Minha lista", icon: Bookmark },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Estrutura da área do assinante: barra superior sólida no desktop, barra inferior no celular. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-none">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-8 lg:px-14">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">{site.name}</span>
            <span className="hidden size-2 rounded-full bg-accent sm:inline-block" aria-hidden />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-2 text-sm transition-colors duration-150 hover:text-text",
                    active ? "font-semibold text-text" : "text-muted",
                  )}
                >
                  {item.label}
                  {active ? <span className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-accent" aria-hidden /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/avisos"
              aria-label="Avisos"
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <Bell className="size-5" strokeWidth={1.75} />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-seal" aria-hidden />
            </Link>
            <Link
              href="/conta"
              aria-label="Perfil e conta"
              className="hidden size-11 items-center justify-center rounded-full hover:bg-surface-2 md:inline-flex"
            >
              <UserRound className="size-5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">{children}</main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {[...nav, { href: "/conta", label: "Perfil", icon: UserRound }].map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
                    active ? "font-semibold text-text" : "text-muted",
                  )}
                >
                  {active ? <span className="absolute inset-x-6 top-0 h-0.5 bg-accent" aria-hidden /> : null}
                  <Icon className={cn("size-5", active && "text-accent")} strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
