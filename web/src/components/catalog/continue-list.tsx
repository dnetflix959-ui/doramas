import Link from "next/link";
import { Play } from "lucide-react";
import { format, type Dictionary } from "@/i18n/config";

export interface ContinueItem {
  href: string;
  name: string;
  tone: string;
  chapter: number;
  chapterTitle: string;
  progress: number;
}

/** Capítulos em andamento, em lista (não carrossel), com marcador de página como progresso. */
export function ContinueList({ items, t }: { items: ContinueItem[]; t: Dictionary["continue"] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="continuar" className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-14">
      <h2 id="continuar" className="font-display text-2xl font-bold">
        {t.title}
      </h2>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const pct = Math.round(Math.min(Math.max(item.progress, 0), 1) * 100);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-4 border border-line bg-surface p-3 transition-colors duration-150 hover:bg-surface-2"
              >
                <div
                  className="relative flex size-16 shrink-0 items-center justify-center rounded-xs"
                  style={{ backgroundColor: item.tone }}
                >
                  <Play className="size-5 fill-current text-text opacity-80 group-hover:opacity-100" strokeWidth={1.75} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="truncate text-sm text-muted">
                    {format(t.chapterLine, { n: item.chapter, title: item.chapterTitle })}
                  </p>
                  <div
                    className="mt-2 h-0.5 bg-line"
                    role="progressbar"
                    aria-label={format(t.watched, { pct })}
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
