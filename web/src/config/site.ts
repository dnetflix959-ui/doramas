// Configuração central do produto. O nome é provisório: troque aqui quando a marca for definida.
// Idiomas ficam em src/i18n/config.ts.
export const site = {
  name: "Dorama",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
