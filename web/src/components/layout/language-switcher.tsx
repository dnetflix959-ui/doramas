"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeCookie, localeNames, locales, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

/** Guarda o idioma escolhido por 1 ano; o proxy usa esse cookie nas próximas visitas. */
function rememberLocale(locale: Locale) {
  document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/** Troca de idioma mantendo a página atual. */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
      <span className="mr-2 text-muted">{label}</span>
      {locales.map((locale) => (
        <Link
          key={locale}
          href={switchLocalePath(pathname, locale)}
          hrefLang={locale}
          lang={locale}
          onClick={() => rememberLocale(locale)}
          aria-current={locale === current ? "true" : undefined}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors duration-150",
            locale === current ? "bg-surface-2 font-semibold text-text" : "text-muted hover:text-text",
          )}
        >
          {localeNames[locale]}
        </Link>
      ))}
    </nav>
  );
}
