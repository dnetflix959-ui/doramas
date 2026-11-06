import Link from "next/link";
import { Seal } from "@/components/ui/seal";
import { cn } from "@/lib/cn";

export interface TitleCardProps {
  href: string;
  name: string;
  meta: string;
  tone: string;
  /** Texto do carimbo "Novo" no idioma atual; ausente quando o título não é novo. */
  newLabel?: string;
  className?: string;
}

/** Cartão de título com lombada: faixa lateral com o nome na vertical, como um livro na estante. */
export function TitleCard({ href, name, meta, tone, newLabel, className }: TitleCardProps) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <div
        className="relative flex aspect-[3/4] overflow-hidden rounded-xs border border-line transition-transform duration-200 ease-out group-hover:-translate-y-0.5"
        style={{ backgroundColor: tone }}
      >
        {/* Lombada */}
        <div className="flex w-9 shrink-0 items-center justify-center border-r border-black/25 bg-black/20">
          <span className="vertical-text truncate py-3 text-xs font-semibold tracking-[0.2em] text-text/85 uppercase">
            {name}
          </span>
        </div>

        {/* Capa: arte provisória até existir imagem real */}
        <div className="relative flex flex-1 flex-col justify-end p-3">
          <span className="font-display text-lg leading-tight font-bold text-text sm:text-xl">{name}</span>
          {newLabel ? <Seal className="absolute top-3 right-3">{newLabel}</Seal> : null}
        </div>
      </div>

      <p className="mt-2 truncate text-sm text-muted">{meta}</p>
    </Link>
  );
}
