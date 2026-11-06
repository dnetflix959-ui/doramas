"use server";

import { revalidatePath } from "next/cache";
import { defaultLocale, hasLocale, locales, localePath, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { validateSubtitleFile } from "@/lib/subtitle-file";

function readLang(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

function readReturnTo(formData: FormData, lang: Locale): string {
  const value = String(formData.get("return_to") ?? "");
  return value || localePath(lang, "/admin/titulos");
}

export type SubtitleFormState =
  | { status: "idle" }
  | { status: "saved"; locale: Locale }
  | { status: "error"; message: string };

/** Envia a legenda `.vtt` de um episódio num idioma, substituindo a anterior se já existir uma. */
export async function saveSubtitle(_prev: SubtitleFormState, formData: FormData): Promise<SubtitleFormState> {
  const lang = readLang(formData);
  const episodeId = String(formData.get("episode_id") ?? "");
  const localeRaw = String(formData.get("locale") ?? "");
  const file = formData.get("file");

  if (!hasLocale(localeRaw)) return { status: "error", message: "Idioma inválido." };
  if (!episodeId) return { status: "error", message: "Episódio inválido." };
  if (!(file instanceof File)) return { status: "error", message: "Escolha um arquivo .vtt." };

  const problem = validateSubtitleFile(file);
  if (problem === "empty") return { status: "error", message: "Escolha um arquivo .vtt." };
  if (problem === "extension") return { status: "error", message: "O arquivo precisa terminar em .vtt." };
  if (problem === "size") return { status: "error", message: "Arquivo maior que 256 KB." };

  const supabase = await createClient();
  const path = `${episodeId}/${localeRaw}.vtt`;
  const { error: uploadError } = await supabase.storage
    .from("legendas")
    .upload(path, file, { upsert: true, contentType: "text/vtt" });
  if (uploadError) {
    return { status: "error", message: "Não foi possível enviar o arquivo. Tente de novo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("legendas").getPublicUrl(path);

  const { error: dbError } = await supabase
    .from("subtitles")
    .upsert({ episode_id: episodeId, locale: localeRaw, url: publicUrl }, { onConflict: "episode_id,locale" });
  if (dbError) {
    return { status: "error", message: "O arquivo foi enviado, mas não consegui salvar o registro. Tente de novo." };
  }

  revalidatePath(readReturnTo(formData, lang));
  return { status: "saved", locale: localeRaw };
}

export type TranslationFormState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

/** Grava título/sinopse de um episódio por idioma (quem ficar em branco não é salvo). */
export async function saveEpisodeTranslations(
  _prev: TranslationFormState,
  formData: FormData,
): Promise<TranslationFormState> {
  const lang = readLang(formData);
  const episodeId = String(formData.get("episode_id") ?? "");
  if (!episodeId) return { status: "error", message: "Episódio inválido." };

  const rows: { episode_id: string; locale: Locale; title: string | null; synopsis: string | null }[] = [];
  for (const locale of locales) {
    const title = String(formData.get(`title_${locale}`) ?? "").trim();
    const synopsis = String(formData.get(`synopsis_${locale}`) ?? "").trim();
    if (title || synopsis) rows.push({ episode_id: episodeId, locale, title: title || null, synopsis: synopsis || null });
  }
  if (rows.length === 0) return { status: "saved" };

  const supabase = await createClient();
  const { error } = await supabase.from("episode_translations").upsert(rows, { onConflict: "episode_id,locale" });
  if (error) return { status: "error", message: "Não foi possível salvar. Tente de novo." };

  revalidatePath(readReturnTo(formData, lang));
  return { status: "saved" };
}
