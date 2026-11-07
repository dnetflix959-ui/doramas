"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { defaultLocale, hasLocale, locales, localePath, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const statuses = ["draft", "scheduled", "published"] as const;
type Status = (typeof statuses)[number];

export type TitleFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<"slug" | "name_pt", string>> };

function readLang(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

/** Cria ou atualiza um título e as traduções (pt/en/es) em uma chamada. */
export async function saveTitle(_prev: TitleFormState, formData: FormData): Promise<TitleFormState> {
  const lang = readLang(formData);
  const titleId = String(formData.get("title_id") ?? "") || null;
  const kind = String(formData.get("kind") ?? "");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const status = String(formData.get("status") ?? "draft");
  const featured = formData.get("featured") === "on";
  // Já vem em UTC (ISO): o cliente converte a partir da hora local do navegador antes de enviar
  // (ver title-form.tsx, withUtcReleaseAt) — o servidor nunca deve reinterpretar esse texto.
  const releaseAt = String(formData.get("release_at") ?? "").trim() || null;

  if (!slugPattern.test(slug) || slug.length > 80) {
    return { status: "error", message: "Link (slug) inválido.", fields: { slug: "Use só letras minúsculas, números e hífen (ex.: amor-em-seul)." } };
  }
  if (!titleId && kind !== "series" && kind !== "movie") {
    return { status: "error", message: "Escolha o tipo do título." };
  }
  if (!statuses.includes(status as Status)) {
    return { status: "error", message: "Status inválido." };
  }

  const translations: { locale: Locale; name: string; synopsis: string | null }[] = [];
  for (const locale of locales) {
    const name = String(formData.get(`name_${locale}`) ?? "").trim();
    const synopsis = String(formData.get(`synopsis_${locale}`) ?? "").trim();
    if (name) translations.push({ locale, name, synopsis: synopsis || null });
    else if (locale === "pt") {
      return {
        status: "error",
        message: "O nome em português é obrigatório.",
        fields: { name_pt: "Preencha o nome em português." },
      };
    }
  }

  const supabase = await createClient();

  let id = titleId;
  if (id) {
    const { error } = await supabase
      .from("titles")
      .update({ slug, status, featured, release_at: releaseAt })
      .eq("id", id);
    if (error) {
      return { status: "error", message: translateDbError(error.message) };
    }
  } else {
    const { data, error } = await supabase
      .from("titles")
      .insert({ kind, slug, status, featured, release_at: releaseAt })
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: translateDbError(error?.message ?? "") };
    }
    id = data.id as string;
  }

  const { error: translationsError } = await supabase
    .from("title_translations")
    .upsert(
      translations.map((t) => ({ title_id: id, locale: t.locale, name: t.name, synopsis: t.synopsis })),
      { onConflict: "title_id,locale" },
    );
  if (translationsError) {
    return { status: "error", message: translateDbError(translationsError.message) };
  }

  revalidatePath(localePath(lang, "/admin/titulos"));
  redirect(`${localePath(lang, "/admin/titulos")}/${id}`);
}

/** Cria a próxima temporada (número = maior existente + 1) de um título série. */
export async function createSeason(formData: FormData) {
  const lang = readLang(formData);
  const titleId = String(formData.get("title_id") ?? "");
  if (!titleId) return;

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("seasons")
    .select("number")
    .eq("title_id", titleId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("seasons").insert({ title_id: titleId, number: (last?.number ?? 0) + 1 });
  revalidatePath(`${localePath(lang, "/admin/titulos")}/${titleId}`);
}

/** Apaga uma temporada vazia. Bloqueado no servidor (não só confiando no cascade) se já houver episódio. */
export async function deleteSeason(formData: FormData) {
  const lang = readLang(formData);
  const titleId = String(formData.get("title_id") ?? "");
  const seasonId = String(formData.get("season_id") ?? "");
  if (!titleId || !seasonId) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("episodes")
    .select("id", { count: "exact", head: true })
    .eq("season_id", seasonId);

  if ((count ?? 0) > 0) {
    redirect(`${localePath(lang, "/admin/titulos")}/${titleId}?erro=temporada-com-episodios`);
  }

  await supabase.from("seasons").delete().eq("id", seasonId);
  revalidatePath(`${localePath(lang, "/admin/titulos")}/${titleId}`);
}

function translateDbError(message: string): string {
  if (message.includes("titles_slug_key") || message.includes("duplicate key")) {
    return "Esse link (slug) já está em uso por outro título.";
  }
  if (message.includes("kind") && message.includes("content")) {
    return "Não é possível trocar o tipo de um título que já tem temporadas ou episódios.";
  }
  return "Não foi possível salvar. Tente de novo.";
}
