import { cn } from "@/lib/cn";

/** Carimbo redondo (inspirado no dojang) para "NOVO", "AO VIVO" etc. */
export function Seal({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-12 -rotate-12 items-center justify-center rounded-full border-2 border-seal",
        "text-center text-[10px] leading-none font-bold tracking-wider text-seal uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
