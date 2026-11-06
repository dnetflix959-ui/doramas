import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale } from "@/i18n/config";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Volta do link mágico e do Google: troca o código pela sessão e leva a pessoa para onde ia.
 * Em caso de falha, volta para a tela de entrar com um aviso.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), `/${defaultLocale}`);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const lang = next.split("/")[1] || defaultLocale;
  return NextResponse.redirect(new URL(`/${lang}/entrar?erro=link`, origin));
}
