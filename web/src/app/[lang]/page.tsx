import { ContinueList } from "@/components/catalog/continue-list";
import { CoverStory } from "@/components/catalog/cover-story";
import { MoodShelf } from "@/components/catalog/mood-shelf";
import { WeekGuide } from "@/components/catalog/week-guide";
import { AppShell } from "@/components/layout/app-shell";
import { coverStory, demoTitles, inProgress, scheduled, type DemoTitle } from "@/data/demo";
import { format, localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getPublishedTitles, type HomeTitle } from "@/lib/catalog/home-feed";

// Página "Hoje": mostra o catálogo real (Épico 2) assim que existir pelo menos um título publicado;
// enquanto o catálogo estiver vazio, continua com os dados de exemplo (Stories 1.1 e 1.2).
// Navegação completa por título, busca, "continuar assistindo" com progresso real etc. são do Épico 8 —
// aqui só troca o conteúdo mostrado nas seções que já existem.
export default async function TodayPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const realTitles = await getPublishedTitles();

  const href = (title: DemoTitle) => localePath(locale, `/titulo/${title.slug}`);
  const realHref = (title: HomeTitle) => localePath(locale, `/titulo/${title.slug}`);
  const meta = (title: DemoTitle) =>
    title.kind === "movie"
      ? `${t.card.movie} · ${title.genres[0]}`
      : `${format(t.card.chapters, { n: title.chapters ?? 0 })} · ${title.genres[0]}`;
  const kindLabel = (kind: HomeTitle["kind"]) => (kind === "movie" ? t.card.movie : t.card.series);
  const realMeta = (title: HomeTitle) =>
    title.genre ? `${kindLabel(title.kind)} · ${title.genre}` : kindLabel(title.kind);

  if (realTitles.length > 0) {
    const cover = realTitles.find((title) => title.featured) ?? realTitles[0];

    return (
      <AppShell locale={locale} nav={t.nav} footer={t.footer}>
        <div className="flex flex-col gap-14 pb-16 sm:gap-20">
          <CoverStory
            t={t.cover}
            href={realHref(cover)}
            name={cover.name}
            synopsis={cover.synopsis}
            meta={realMeta(cover)}
            tone={cover.tone}
            chapter={1}
            chapterTitle={cover.kind === "movie" ? cover.name : ""}
            premiere="Disponível agora"
          />

          <MoodShelf
            t={t.shelf}
            newLabel={t.card.new}
            titles={realTitles.map((title) => ({
              href: realHref(title),
              name: title.name,
              meta: realMeta(title),
              tone: title.tone,
              isNew: title.isNew,
              // Gêneros humor/emoção (moods) ainda não existem no schema do catálogo (ver Épico 2) — sem
              // dado real para isso, nenhum título aparece nos filtros de emoção específicos; a aba "Tudo"
              // continua mostrando todos.
              moods: [],
            }))}
          />
        </div>
      </AppShell>
    );
  }

  const cover = coverStory;

  return (
    <AppShell locale={locale} nav={t.nav} footer={t.footer}>
      <div className="flex flex-col gap-14 pb-16 sm:gap-20">
        <CoverStory
          t={t.cover}
          href={href(cover)}
          name={cover.name}
          synopsis={cover.synopsis}
          meta={`${cover.year} · ${format(t.card.chapters, { n: cover.chapters ?? 0 })} · ${cover.genres.join(" · ")}`}
          tone={cover.tone}
          chapter={cover.nextChapter?.number ?? 1}
          chapterTitle={cover.nextChapter?.title ?? ""}
          premiere={format(t.cover.every, {
            day: t.guide.weekdaysLong[cover.releaseDay ?? 0],
            time: cover.releaseTime ?? "",
          })}
        />

        <ContinueList
          t={t.continue}
          items={inProgress.map((title) => ({
            href: href(title),
            name: title.name,
            tone: title.tone,
            chapter: title.watching!.chapter,
            chapterTitle: title.watching!.chapterTitle,
            progress: title.watching!.progress,
          }))}
        />

        <WeekGuide
          t={t.guide}
          seeAllHref={localePath(locale, "/grade")}
          entries={scheduled.map((title) => ({
            href: href(title),
            name: title.name,
            day: title.releaseDay!,
            time: title.releaseTime ?? "",
            chapter: title.nextChapter?.number ?? 1,
            chapterTitle: title.nextChapter?.title ?? "",
            tone: title.tone,
          }))}
        />

        <MoodShelf
          t={t.shelf}
          newLabel={t.card.new}
          titles={demoTitles.map((title) => ({
            href: href(title),
            name: title.name,
            meta: meta(title),
            tone: title.tone,
            isNew: title.isNew,
            moods: title.moods,
          }))}
        />
      </div>
    </AppShell>
  );
}
