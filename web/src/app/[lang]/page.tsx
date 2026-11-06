import { ContinueList } from "@/components/catalog/continue-list";
import { CoverStory } from "@/components/catalog/cover-story";
import { MoodShelf } from "@/components/catalog/mood-shelf";
import { WeekGuide } from "@/components/catalog/week-guide";
import { AppShell } from "@/components/layout/app-shell";
import { coverStory, demoTitles, inProgress, scheduled, type DemoTitle } from "@/data/demo";
import { format, localePath } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";

// Página "Hoje" de demonstração (Stories 1.1 e 1.2), com dados de exemplo até o catálogo real existir.
export default async function TodayPage() {
  const locale = await getLocale();
  const t = await getDictionary();

  const href = (title: DemoTitle) => localePath(locale, `/titulo/${title.slug}`);
  const meta = (title: DemoTitle) =>
    title.kind === "movie"
      ? `${t.card.movie} · ${title.genres[0]}`
      : `${format(t.card.chapters, { n: title.chapters ?? 0 })} · ${title.genres[0]}`;

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
