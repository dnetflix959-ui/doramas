import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Dictionary, type Locale } from "./config";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  pt: () => import("./dictionaries/pt.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  es: () => import("./dictionaries/es.json").then((m) => m.default),
};

/** Idioma da rota atual (segmento [lang]). Dá 404 para idiomas não suportados. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!value || !hasLocale(value)) notFound();
  return value;
}

/** Textos da interface no idioma da rota atual. */
export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()]();
}
