"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { defaultLocale, hasLocale, localePath, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { parseYoutubeId } from "@/lib/youtube";

const statuses = ["draft", "scheduled", "published"] as const;
type Status = (typeof statuses)[number];

export type EpisodeFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fields?: Partial<Record<"video_ref" | "number", string>> };

function readLang(formData: FormData): Locale {
  const value = String(formData.get("lang") ?? "");
  return hasLocale(value) ? value : defaultLocale;
}

function readOptionalInt(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

/** Caminho de volta: a temporada (série) ou o próprio título (filme). */
function parentPath(lang: Locale, titleId: string, seasonId: string | null): string {
  const base = `${localePath(lang, "/admin/titulos")}/${titleId}`;
  return seasonId ? `${base}/temporadas/${seasonId}` : base;
}

/** Cria ou atualiza um episódio — de uma temporada (série) ou o vídeo único de um filme. */
export async function saveEpisode(_prev: EpisodeFormState, formData: FormData): Promise<EpisodeFormState> {
  const lang = readLang(formData);
  const episodeId = String(formData.get("episode_id") ?? "") || null;
  const titleId = String(formData.get("title_id") ?? "");
  const seasonId = String(formData.get("season_id") ?? "") || null;
  const youtubeLink = String(formData.get("youtube_link") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const isFree = formData.get("is_free") === "on";
  // Já vem em UTC (ISO): convertido no navegador antes de enviar (mesmo padrão de title-form.tsx).
  const releaseAt = String(formData.get("release_at") ?? "").trim() || null;

  const videoRef = parseYoutubeId(youtubeLink);
  if (!videoRef) {
    return {
      status: "error",
      message: "Não reconheci esse link do YouTube.",
      fields: { video_ref: "Cole o link completo (ex.: youtube.com/watch?v=... ou youtu.be/...) ou só o ID." },
    };
  }
  if (!statuses.includes(status as Status)) {
    return { status: "error", message: "Status inválido." };
  }

  const number = seasonId ? Number(formData.get("number") ?? "0") : 1;
  if (seasonId && (!Number.isInteger(number) || number < 1)) {
    return { status: "error", message: "Número do episódio inválido.", fields: { number: "Use um número inteiro maior que 0." } };
  }

  const row = {
    season_id: seasonId,
    title_id: seasonId ? null : titleId,
    number,
    video_provider: "youtube" as const,
    video_ref: videoRef,
    duration_s: readOptionalInt(formData, "duration_s"),
    intro_start_s: readOptionalInt(formData, "intro_start_s"),
    intro_end_s: readOptionalInt(formData, "intro_end_s"),
    credits_start_s: readOptionalInt(formData, "credits_start_s"),
    release_at: releaseAt,
    is_free: isFree,
    status,
  };

  const supabase = await createClient();
  const { error } = episodeId
    ? await supabase.from("episodes").update(row).eq("id", episodeId)
    : await supabase.from("episodes").insert(row);

  if (error) {
    return { status: "error", message: translateDbError(error.message) };
  }

  revalidatePath(parentPath(lang, titleId, seasonId));
  redirect(parentPath(lang, titleId, seasonId));
}

function translateDbError(message: string): string {
  if (message.includes("episodes_season_number_uidx") || message.includes("duplicate key")) {
    return "Já existe um episódio com esse número nesta temporada.";
  }
  return "Não foi possível salvar. Tente de novo.";
}
