"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { defaultLocale, hasLocale, localePath, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function readLang(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

export type GenreFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<"slug" | "name_pt" | "name_en" | "name_es", string>> };

/** Cria ou atualiza um gênero (nome nos 3 idiomas — sem tabela de tradução separada, ver story 2.1). */
export async function saveGenre(_prev: GenreFormState, formData: FormData): Promise<GenreFormState> {
  const lang = readLang(formData);
  const genreId = String(formData.get("genre_id") ?? "") || null;
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const namePt = String(formData.get("name_pt") ?? "").trim();
  const nameEn = String(formData.get("name_en") ?? "").trim();
  const nameEs = String(formData.get("name_es") ?? "").trim();

  if (!slugPattern.test(slug) || slug.length > 50) {
    return { status: "error", message: "Link (slug) inválido.", fields: { slug: "Só letras minúsculas, números e hífen." } };
  }
  if (!namePt) return { status: "error", message: "Preencha o nome em português.", fields: { name_pt: "Obrigatório." } };
  if (!nameEn) return { status: "error", message: "Preencha o nome em inglês.", fields: { name_en: "Obrigatório." } };
  if (!nameEs) return { status: "error", message: "Preencha o nome em espanhol.", fields: { name_es: "Obrigatório." } };

  const supabase = await createClient();
  const row = { slug, name_pt: namePt, name_en: nameEn, name_es: nameEs };
  const { error } = genreId
    ? await supabase.from("genres").update(row).eq("id", genreId)
    : await supabase.from("genres").insert(row);

  if (error) {
    const message = error.message.includes("duplicate key") ? "Esse link (slug) já está em uso." : "Não foi possível salvar. Tente de novo.";
    return { status: "error", message };
  }

  revalidatePath(localePath(lang, "/admin/generos"));
  redirect(localePath(lang, "/admin/generos"));
}

/** Apaga um gênero. Bloqueado no servidor se algum título ainda usa (checa antes, não confia só no cascade). */
export async function deleteGenre(formData: FormData) {
  const lang = readLang(formData);
  const genreId = String(formData.get("genre_id") ?? "");
  if (!genreId) return;

  const supabase = await createClient();
  const { count } = await supabase
    .from("title_genres")
    .select("title_id", { count: "exact", head: true })
    .eq("genre_id", genreId);

  if ((count ?? 0) > 0) {
    redirect(`${localePath(lang, "/admin/generos")}?erro=genero-em-uso`);
  }

  await supabase.from("genres").delete().eq("id", genreId);
  revalidatePath(localePath(lang, "/admin/generos"));
}

/** Substitui os gêneros de um título pelos selecionados no formulário da página de editar título. */
export async function saveTitleGenres(formData: FormData) {
  const lang = readLang(formData);
  const titleId = String(formData.get("title_id") ?? "");
  if (!titleId) return;

  const selected = formData.getAll("genre_id").map(String);
  const supabase = await createClient();

  await supabase.from("title_genres").delete().eq("title_id", titleId);
  if (selected.length > 0) {
    await supabase.from("title_genres").insert(selected.map((genreId) => ({ title_id: titleId, genre_id: genreId })));
  }

  revalidatePath(`${localePath(lang, "/admin/titulos")}/${titleId}`);
}
