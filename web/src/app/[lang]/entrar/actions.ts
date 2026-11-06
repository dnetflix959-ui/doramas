"use server";

import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { defaultLocale, hasLocale, type Locale } from "@/i18n/config";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; reason: "invalid" | "send"; email: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

function callbackUrl(locale: Locale, formData: FormData): string {
  const next = safeNext(String(formData.get("next") ?? ""), `/${locale}`);
  return `${site.url}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Envia o link mágico. Cria a conta se o e-mail ainda não existir. */
export async function requestMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 254) return { status: "error", reason: "invalid", email };

  const locale = readLocale(formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl(locale, formData),
      shouldCreateUser: true,
      data: { locale }, // usado pelo gatilho que cria a conta
    },
  });

  if (error) {
    console.error("Falha ao enviar link mágico:", error.message);
    return { status: "error", reason: "send", email };
  }
  return { status: "sent", email };
}

/** Inicia o login com Google e leva a pessoa para a tela do Google. */
export async function signInWithGoogle(formData: FormData) {
  const locale = readLocale(formData);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(locale, formData) },
  });

  if (error || !data.url) {
    console.error("Falha ao iniciar login com Google:", error?.message);
    redirect(`/${locale}/entrar?erro=google`);
  }
  redirect(data.url);
}

/** Sai da conta e volta para a página inicial. */
export async function signOut(formData: FormData) {
  const locale = readLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
