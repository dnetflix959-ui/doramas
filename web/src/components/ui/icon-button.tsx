import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto lido por leitores de tela; obrigatório porque o botão só tem ícone. */
  label: string;
  children: ReactNode;
}

export function IconButton({ label, className, children, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-text",
        "transition-colors duration-150 hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
