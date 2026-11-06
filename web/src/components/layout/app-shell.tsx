"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Bell, Bookmark, CalendarDays, Compass, Sun, UserRound } from "lucide-react";
import { site } from "@/config/site";
import { localePath, type Dictionary, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { LanguageSwitcher } from "./language-switcher";

export interface AppShellProps {
  locale: Locale;
  nav: Dictionary["nav"];
  footer: Dictionary["footer"];
  children: ReactNode;
}

/** Estrutura da área do assinante: barra superior sólida no desktop, barra inferior no celular. */
export function AppShell({ locale, nav: t, footer, children }: AppShellProps) {
  const pathname = usePathname();
  const home = localePath(locale, "/");

  const items = [
    { href: home, label: t.today, icon: Sun },
    { href: localePath(locale, "/grade"), label: t.guide, icon: CalendarDays },
    { href: localePath(locale, "/explorar"), label: t.explore, icon: Compass },
    { href: localePath(locale, "/minha-lista"), label: t.myList, icon: Bookmark },
  ];
  const accountHref = localePath(locale, "/conta");

  const isActive = (href: string) => (href === home ? pathname === home : pathname.startsWith(href));

  return (
    <div className="flex min-h-svh flex-col">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-8 lg:px-14">
          <Link href={home} className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold">{site.name}</span>
            <span className="hidden size-2 rounded-full bg-accent sm:inline-block" aria-hidden />
          </Link>

          <nav aria-label={t.main} className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = isActive(item.href);
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
              href={localePath(locale, "/avisos")}
              aria-label={t.notifications}
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
            >
              <Bell className="size-5" strokeWidth={1.75} />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-seal" aria-hidden />
            </Link>
            <Link
              href={accountHref}
              aria-label={t.account}
              className="hidden size-11 items-center justify-center rounded-full hover:bg-surface-2 md:inline-flex"
            >
              <UserRound className="size-5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line pb-24 md:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <p className="text-sm text-muted">
            <span className="font-display font-bold text-text">{site.name}</span> · {footer.note}
          </p>
          <LanguageSwitcher current={locale} label={footer.language} />
        </div>
      </footer>

      <nav
        aria-label={t.main}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {[...items, { href: accountHref, label: t.profile, icon: UserRound }].map((item) => {
            const active = isActive(item.href);
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
