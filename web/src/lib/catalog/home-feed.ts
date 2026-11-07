import "server-only";
import { createClient } from "@/lib/supabase/server";

export type HomeTitle = {
  slug: string;
  name: string;
  kind: "series" | "movie";
  synopsis: string;
  /** Primeiro gênero associado, se houver (title_genres) — sem gênero, cai para o rótulo do tipo. */
  genre: string | null;
  featured: boolean;
  /** Cor provisória do card enquanto não há imagem real (mesmo conceito de src/data/demo.ts). */
  tone: string;
  /** Publicado nos últimos 14 dias. */
  isNew: boolean;
};

// Mesma paleta usada nos dados de exemplo (src/data/demo.ts) — só placeholder visual, não é dado do catálogo.
const TONE_PALETTE = ["#6E3B34", "#25343B", "#3B2E52", "#2E4A3B", "#4A3B2E"];

function toneForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) % TONE_PALETTE.length;
  return TONE_PALETTE[Math.abs(hash) % TONE_PALETTE.length];
}

type TitleRow = {
  slug: string;
  kind: string;
  featured: boolean;
  created_at: string;
  title_translations: { locale: string; name: string; synopsis: string | null }[] | null;
  title_genres: { genres: { name_pt: string } | null }[] | null;
};

/**
 * Títulos publicados, com tradução em português — para a home mostrar o catálogo real do Épico 2 em vez
 * dos dados de exemplo (src/data/demo.ts), assim que existir pelo menos um título publicado.
 * Página pública completa (navegação por título, busca, etc.) é escopo do Épico 8 — isto só troca os
 * dados mostrados nas seções que já existem na home.
 */
export async function getPublishedTitles(): Promise<HomeTitle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("titles")
    .select(
      "slug, kind, featured, created_at, title_translations(locale, name, synopsis), title_genres(genres(name_pt))",
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as TitleRow[];
  const twoWeeksAgo = Date.now() - 1000 * 60 * 60 * 24 * 14;

  return rows.flatMap((row): HomeTitle[] => {
    const pt = row.title_translations?.find((t) => t.locale === "pt");
    if (!pt) return [];
    return [
      {
        slug: row.slug,
        name: pt.name,
        kind: row.kind === "movie" ? "movie" : "series",
        synopsis: pt.synopsis ?? "",
        genre: row.title_genres?.[0]?.genres?.name_pt ?? null,
        featured: row.featured,
        tone: toneForSlug(row.slug),
        isNew: new Date(row.created_at).getTime() >= twoWeeksAgo,
      },
    ];
  });
}
