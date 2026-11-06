import "server-only";
import { redirect } from "next/navigation";
import { localePath, type Locale } from "@/i18n/config";
import { createClient } from "./server";

/**
 * Garante que quem está vendo a página é admin. Redireciona para a entrada (se não estiver logado) ou
 * para a home (se estiver logado mas não for admin). O proxy já exige login em `/admin`; isto checa o papel.
 */
export async function requireAdmin(lang: Locale) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${localePath(lang, "/entrar")}?next=${encodeURIComponent(localePath(lang, "/admin/titulos"))}`);
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) {
    redirect(localePath(lang, "/"));
  }

  return { supabase, userId: user.id };
}
