import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Player } from "@/components/player/player";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

// Página pública mínima de título — só o essencial para o Player funcionar (nome, sinopse, primeiro
// episódio). Navegação completa por título (temporadas, progresso, "minha lista", trailer etc., FR7) é
// escopo do Épico 8; aqui evita que o link da home (Épico 2) leve a um 404 enquanto o Épico 8 não existe.
export default async function TitlePage({ params }: PageProps<"/[lang]/titulo/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getDictionary();

  const supabase = await createClient();
  const { data: title } = await supabase
    .from("titles")
    .select("id, kind, title_translations(locale, name, synopsis)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!title) notFound();

  const translations = title.title_translations as { locale: string; name: string; synopsis: string | null }[] | null;
  const pt = translations?.find((tr) => tr.locale === "pt");
  if (!pt) notFound();

  let episodeId: string | null = null;
  if (title.kind === "movie") {
    const { data: episode } = await supabase.from("episodes").select("id").eq("title_id", title.id).maybeSingle();
    episodeId = episode?.id ?? null;
  } else {
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("title_id", title.id)
      .eq("number", 1)
      .maybeSingle();
    if (season) {
      const { data: episode } = await supabase
        .from("episodes")
        .select("id")
        .eq("season_id", season.id)
        .eq("number", 1)
        .maybeSingle();
      episodeId = episode?.id ?? null;
    }
  }

  return (
    <AppShell locale={locale} nav={t.nav} footer={t.footer}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-20 sm:px-8 lg:pt-24">
        <div>
          <h1 className="font-display text-3xl font-bold">{pt.name}</h1>
          {pt.synopsis && <p className="mt-2 leading-relaxed text-text/90">{pt.synopsis}</p>}
        </div>
        {episodeId ? (
          <Player episodeId={episodeId} />
        ) : (
          <p className="text-sm text-muted">Em breve.</p>
        )}
      </div>
    </AppShell>
  );
}
