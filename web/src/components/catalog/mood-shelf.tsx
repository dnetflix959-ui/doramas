"use client";

import { useState } from "react";
import { TitleCard } from "@/components/catalog/title-card";
import { cn } from "@/lib/cn";

export interface ShelfTitle {
  href: string;
  name: string;
  meta: string;
  tone: string;
  isNew?: boolean;
  moods: string[];
}

/** Estante por emoção: a pessoa escolhe o que quer sentir e vê os títulos em grade. */
export function MoodShelf({ titles, moods }: { titles: ShelfTitle[]; moods: { id: string; label: string }[] }) {
  const [mood, setMood] = useState<string | null>(null);
  const visible = mood ? titles.filter((t) => t.moods.includes(mood)) : titles;

  return (
    <section aria-labelledby="estante" className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-14">
      <h2 id="estante" className="font-display text-2xl font-bold">
        O que você quer sentir hoje?
      </h2>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: null, label: "Tudo" }, ...moods].map((m) => {
          const active = mood === m.id;
          return (
            <button
              key={m.label}
              type="button"
              aria-pressed={active}
              onClick={() => setMood(m.id)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 text-sm transition-colors duration-150",
                active ? "border-accent bg-accent font-semibold text-accent-ink" : "border-line text-text hover:bg-surface-2",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {visible.map((t) => (
          <TitleCard key={t.href} href={t.href} name={t.name} meta={t.meta} tone={t.tone} isNew={t.isNew} />
        ))}
      </div>
    </section>
  );
}
