import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, localeCookie, type Locale } from "@/i18n/config";
import { updateSession } from "@/lib/supabase/proxy";

/** Áreas que exigem login (sem o prefixo de idioma). */
const protectedPaths = ["/conta", "/minha-lista", "/avisos", "/admin"];

/** Escolhe o idioma: primeiro o que a pessoa escolheu (cookie), depois o do navegador, senão português. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(localeCookie)?.value;
  if (saved && hasLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((p) => p.base)
    .sort((a, b) => b.q - a.q);

  for (const { base } of preferred) {
    if (hasLocale(base)) return base;
  }
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rotas de autenticação (/auth/...) não têm idioma: só renovam a sessão.
  if (pathname.startsWith("/auth/")) {
    return (await updateSession(request)).response;
  }

  // 1. Garante o prefixo de idioma.
  const first = pathname.split("/")[1] ?? "";
  if (!hasLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 2. Renova a sessão e protege as áreas de assinante/admin.
  const { response, userId } = await updateSession(request);
  const rest = pathname.slice(first.length + 1) || "/";
  const needsLogin = protectedPaths.some((p) => rest === p || rest.startsWith(`${p}/`));

  if (needsLogin && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/entrar`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Ignora arquivos internos, API e arquivos com extensão (imagens, ícones etc.).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
