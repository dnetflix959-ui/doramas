"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { format, type Dictionary } from "@/i18n/config";
import { cn } from "@/lib/cn";

const noopSubscribe = () => () => {};
/** Dia de hoje no navegador (0 = segunda). No servidor é null para não fixar a data do build. */
function useToday(): number | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => (new Date().getDay() + 6) % 7,
    () => null,
  );
}

export interface GuideEntry {
  href: string;
  name: string;
  day: number;
  time: string;
  chapter: number;
  chapterTitle: string;
  tone: string;
}

/** Grade da semana: o que estreia em cada dia. Hoje começa selecionado. */
export function WeekGuide({
  entries,
  seeAllHref,
  t,
}: {
  entries: GuideEntry[];
  seeAllHref: string;
  t: Dictionary["guide"];
}) {
  const today = useToday();
  const [picked, setSelected] = useState<number | null>(null);
  const firstWithEntries = entries.length > 0 ? Math.min(...entries.map((e) => e.day)) : 0;
  const selected = picked ?? today ?? firstWithEntries;
  const dayEntries = entries.filter((e) => e.day === selected);

  return (
    <section aria-labelledby="grade" className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-14">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="grade" className="font-display text-2xl font-bold">
          {t.title}
        </h2>
        <Link href={seeAllHref} className="text-sm text-muted underline-offset-4 hover:text-text hover:underline">
          {t.seeAll}
        </Link>
      </div>

      <div role="tablist" aria-label={t.days} className="mt-4 grid grid-cols-7 border border-line">
        {t.weekdays.map((label, i) => {
          const count = entries.filter((e) => e.day === i).length;
          const active = i === selected;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(i)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 border-line text-sm transition-colors duration-150",
                i > 0 && "border-l",
                active ? "bg-accent font-semibold text-accent-ink" : "hover:bg-surface-2",
              )}
            >
              <span>{label}</span>
              <span className="flex gap-0.5" aria-label={format(t.premieres, { n: count })}>
                {Array.from({ length: count }).map((_, k) => (
                  <span key={k} className={cn("size-1 rounded-full", active ? "bg-accent-ink" : "bg-accent")} />
                ))}
              </span>
              {i === today ? <span className="sr-only">({t.today})</span> : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="border-x border-b border-line">
        {dayEntries.length === 0 ? (
          <p className="p-5 text-sm text-muted">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {dayEntries.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="flex items-center gap-4 p-4 transition-colors hover:bg-surface">
                  <span className="w-14 shrink-0 font-display text-lg font-bold text-accent">{e.time}</span>
                  <span className="size-10 shrink-0 rounded-xs" style={{ backgroundColor: e.tone }} aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{e.name}</span>
                    <span className="block truncate text-sm text-muted">
                      {format(t.chapterLine, { n: e.chapter, title: e.chapterTitle })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
