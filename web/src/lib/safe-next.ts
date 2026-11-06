/**
 * Aceita só caminhos internos para o redirecionamento depois do login ("/pt/conta").
 * Bloqueia URLs externas e "//dominio.com", que levariam a pessoa para fora do site.
 */
export function safeNext(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
