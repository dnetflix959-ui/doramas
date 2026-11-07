"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { saveGenre, type GenreFormState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

export function GenreForm({
  lang,
  genre,
}: {
  lang: Locale;
  genre?: { id: string; slug: string; name_pt: string };
}) {
  const [state, formAction] = useActionState<GenreFormState, FormData>(saveGenre, { status: "idle" });
  const fieldError = (field: "slug" | "name_pt") => (state.status === "error" ? state.fields?.[field] : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="lang" value={lang} />
      {genre ? <input type="hidden" name="genre_id" value={genre.id} /> : null}

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <Input
        label="Link (slug)"
        name="slug"
        required
        defaultValue={genre?.slug}
        placeholder="romance"
        pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
        error={fieldError("slug")}
      />
      <Input label="Nome" name="name_pt" required defaultValue={genre?.name_pt} error={fieldError("name_pt")} />

      <SubmitButton label={genre ? "Salvar" : "Criar gênero"} />
    </form>
  );
}
