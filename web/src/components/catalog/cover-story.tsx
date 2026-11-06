import { Play, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Seal } from "@/components/ui/seal";

export interface CoverStoryProps {
  href: string;
  name: string;
  synopsis: string;
  meta: string;
  tone: string;
  chapter: number;
  chapterTitle: string;
  premiere: string;
}

/**
 * Capa da semana: como a capa de uma revista de folhetins.
 * Arte emoldurada (não sangra a tela), número do capítulo gigante em contorno e título vertical na lateral.
 */
export function CoverStory({ href, name, synopsis, meta, tone, chapter, chapterTitle, premiere }: CoverStoryProps) {
  const numeral = String(chapter).padStart(2, "0");

  return (
    <section aria-labelledby="capa-titulo" className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-8 lg:px-14 lg:pt-24">
      <p className="mb-4 flex items-center gap-3 text-xs font-semibold tracking-[0.25em] text-muted uppercase">
        <span className="h-px w-8 bg-accent" />
        Capa da semana
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
        {/* Arte emoldurada com título vertical */}
        <div className="relative flex aspect-[4/3] border border-line p-2 sm:aspect-[16/10]">
          <div className="relative flex-1" style={{ backgroundColor: tone }}>
            <span className="vertical-text absolute top-4 right-3 font-display text-sm tracking-[0.3em] text-text/70">
              {name}
            </span>
            <Seal className="absolute bottom-4 left-4">Novo</Seal>
          </div>
        </div>

        {/* Texto da capa */}
        <div className="flex flex-col justify-center">
          <div className="flex items-end gap-4">
            <span aria-hidden className="numeral-outline font-display text-8xl leading-none font-bold sm:text-9xl">
              {numeral}
            </span>
            <div className="pb-2">
              <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Capítulo {chapter}</p>
              <p className="font-display text-lg italic">{chapterTitle}</p>
            </div>
          </div>

          <h1 id="capa-titulo" className="mt-6 font-display text-4xl leading-[1.08] font-bold sm:text-5xl">
            {name}
          </h1>
          <p className="mt-2 text-sm text-muted">{meta}</p>
          <p className="mt-4 max-w-lg leading-relaxed text-text/90">{synopsis}</p>
          <p className="mt-4 text-sm text-text/80">
            Estreia: <span className="font-semibold text-text">{premiere}</span>
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={href} size="lg" icon={<Play className="size-5 fill-current" strokeWidth={1.75} />}>
              Assistir capítulo 1
            </ButtonLink>
            <ButtonLink href={href} size="lg" variant="ghost" icon={<Plus className="size-5" strokeWidth={1.75} />}>
              Guardar na lista
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
