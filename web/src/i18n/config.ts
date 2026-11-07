// Configuração de idiomas compartilhada entre servidor, proxy e componentes de cliente.
import type pt from "./dictionaries/pt.json";

// Produto só em português (decisão de 2026-11-06, ver docs/prd/index.md). As rotas continuam com o
// prefixo /pt/... (ver docs/architecture/index.md) — menor risco que remover o segmento [lang].
export const locales = ["pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";

/** Cookie que guarda o idioma escolhido manualmente. */
export const localeCookie = "lang";

/** Valor do atributo `lang` do HTML para cada idioma. */
export const htmlLang: Record<Locale, string> = { pt: "pt-BR" };

/** Nome de cada idioma escrito nele mesmo (sem uso hoje — só 1 idioma, sem seletor). */
export const localeNames: Record<Locale, string> = { pt: "Português" };

export type Dictionary = typeof pt;

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Prefixa um caminho interno com o idioma: ("en", "/grade") → "/en/grade". */
export function localePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Troca o idioma de um caminho já prefixado: ("/pt/grade", "es") → "/es/grade". */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const parts = pathname.split("/");
  if (parts[1] && hasLocale(parts[1])) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || `/${locale}`;
}

/** Preenche "{chave}" num texto: format("Capítulo {n}", { n: 3 }) → "Capítulo 3". */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
