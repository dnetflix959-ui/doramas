"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { datetimeLocalToIso, toDatetimeLocalValue } from "@/lib/datetime-local";
import { saveTitle, type TitleFormState } from "./actions";

export type TitleTranslation = { locale: Locale; name: string; synopsis: string | null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

/** Formulário de criar/editar título. Em edição, `title` vem preenchido e o campo "tipo" fica travado. */
export function TitleForm({
  lang,
  title,
  translations,
}: {
  lang: Locale;
  title?: { id: string; kind: "series" | "movie"; slug: string; status: string; featured: boolean; release_at: string | null };
  translations?: TitleTranslation[];
}) {
  const [state, formAction] = useActionState<TitleFormState, FormData>(saveTitle, { status: "idle" });
  const isEdit = Boolean(title);

  const ptTranslation = translations?.find((t) => t.locale === "pt");
  const fieldError = (field: "slug" | "name_pt") => (state.status === "error" ? state.fields?.[field] : undefined);

  // Converte "Agendar para" (hora local do navegador) para UTC aqui mesmo, antes de enviar — só o
  // navegador sabe o próprio fuso. Corrige o achado REL-001 do gate da story 2.2: antes, o servidor
  // reinterpretava o texto no fuso dele, deslocando o horário a cada edição.
  function withUtcReleaseAt(formData: FormData) {
    const raw = formData.get("release_at");
    formData.set("release_at", datetimeLocalToIso(typeof raw === "string" ? raw : null) ?? "");
    return formAction(formData);
  }

  return (
    <form action={withUtcReleaseAt} className="flex flex-col gap-8">
      <input type="hidden" name="lang" value={lang} />
      {title ? <input type="hidden" name="title_id" value={title.id} /> : null}

      {state.status === "error" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Tipo</span>
          {isEdit ? (
            <p className="flex h-11 items-center text-text/85">{title!.kind === "series" ? "Série" : "Filme"}</p>
          ) : (
            <select
              name="kind"
              required
              defaultValue=""
              className="h-11 rounded-md border border-line bg-surface-2 px-3 text-base text-text"
            >
              <option value="" disabled>
                Escolher…
              </option>
              <option value="series">Série</option>
              <option value="movie">Filme</option>
            </select>
          )}
        </div>

        <Input
          label="Link (slug)"
          name="slug"
          required
          defaultValue={title?.slug}
          placeholder="amor-em-seul"
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          error={fieldError("slug")}
          hint="Só letras minúsculas, números e hífen. Aparece na URL do título."
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-text">Status</span>
          <select
            name="status"
            defaultValue={title?.status ?? "draft"}
            className="h-11 rounded-md border border-line bg-surface-2 px-3 text-base text-text"
          >
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendado</option>
            <option value="published">Publicado</option>
          </select>
        </div>

        <Input
          label="Agendar para (opcional)"
          name="release_at"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(title?.release_at)}
          hint="Hora do seu navegador."
        />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={title?.featured} className="size-4" />
          Destacar na home
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-muted uppercase">Tradução</h2>
        <Input
          label="Nome"
          name="name_pt"
          required
          defaultValue={ptTranslation?.name}
          error={fieldError("name_pt")}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="synopsis_pt" className="text-sm font-medium text-text">
            Sinopse
          </label>
          <textarea
            id="synopsis_pt"
            name="synopsis_pt"
            rows={3}
            defaultValue={ptTranslation?.synopsis ?? ""}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 text-base text-text placeholder:text-muted"
          />
        </div>
      </section>

      <SubmitButton label={isEdit ? "Salvar" : "Criar título"} />
    </form>
  );
}
