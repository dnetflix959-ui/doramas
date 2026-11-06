// Configuração central do produto. O nome é provisório: troque aqui quando a marca for definida.
export const site = {
  name: "Dorama",
  tagline: "Doramas originais, episódio novo toda semana.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locales: ["pt", "en", "es"] as const,
  defaultLocale: "pt" as const,
} as const;

export type Locale = (typeof site.locales)[number];
