import { ContinueList } from "@/components/catalog/continue-list";
import { CoverStory } from "@/components/catalog/cover-story";
import { MoodShelf } from "@/components/catalog/mood-shelf";
import { WeekGuide } from "@/components/catalog/week-guide";
import { AppShell } from "@/components/layout/app-shell";
import { coverStory, demoTitles, inProgress, moods, scheduled, weekdays, type DemoTitle } from "@/data/demo";

function href(t: DemoTitle) {
  return `/titulo/${t.slug}`;
}

function meta(t: DemoTitle) {
  return t.kind === "movie" ? `Filme · ${t.genres[0]}` : `${t.chapters} capítulos · ${t.genres[0]}`;
}

// Página "Hoje" de demonstração (Story 1.1), com dados de exemplo até o catálogo real existir.
export default function TodayPage() {
  const cover = coverStory;

  return (
    <AppShell>
      <div className="flex flex-col gap-14 pb-16 sm:gap-20">
        <CoverStory
          href={href(cover)}
          name={cover.name}
          synopsis={cover.synopsis}
          meta={`${cover.year} · ${cover.chapters} capítulos · ${cover.genres.join(" · ")}`}
          tone={cover.tone}
          chapter={cover.nextChapter?.number ?? 1}
          chapterTitle={cover.nextChapter?.title ?? ""}
          premiere={`toda ${weekdays[cover.releaseDay ?? 0].toLowerCase()}, ${cover.releaseTime}`}
        />

        <ContinueList
          items={inProgress.map((t) => ({
            href: href(t),
            name: t.name,
            tone: t.tone,
            chapter: t.watching!.chapter,
            chapterTitle: t.watching!.chapterTitle,
            progress: t.watching!.progress,
          }))}
        />

        <WeekGuide
          days={weekdays}
          entries={scheduled.map((t) => ({
            href: href(t),
            name: t.name,
            day: t.releaseDay!,
            time: t.releaseTime ?? "",
            chapter: t.nextChapter?.number ?? 1,
            chapterTitle: t.nextChapter?.title ?? "",
            tone: t.tone,
          }))}
        />

        <MoodShelf
          moods={moods}
          titles={demoTitles.map((t) => ({
            href: href(t),
            name: t.name,
            meta: meta(t),
            tone: t.tone,
            isNew: t.isNew,
            moods: t.moods,
          }))}
        />
      </div>
    </AppShell>
  );
}
