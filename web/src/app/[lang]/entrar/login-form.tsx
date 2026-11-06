"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, type Dictionary, type Locale } from "@/i18n/config";
import { requestMagicLink, signInWithGoogle, type MagicLinkState } from "./actions";

function SubmitButton({ label, pending: pendingLabel }: { label: string; pending: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function GoogleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant="ghost" className="w-full" disabled={pending}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-5">
        <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.9s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>
      {label}
    </Button>
  );
}

export function LoginForm({
  lang,
  next,
  initialError,
  t,
}: {
  lang: Locale;
  next: string;
  initialError?: string;
  t: Dictionary["auth"];
}) {
  const [state, formAction] = useActionState<MagicLinkState, FormData>(requestMagicLink, { status: "idle" });
  const [dismissed, setDismissed] = useState(false);

  if (state.status === "sent" && !dismissed) {
    return (
      <div className="border border-line bg-surface p-6" role="status">
        <Mail className="size-8 text-accent" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-2xl font-bold">{t.sentTitle}</h2>
        <p className="mt-2 leading-relaxed text-text/85">{format(t.sentBody, { email: state.email })}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-text"
        >
          {t.useAnother}
        </button>
      </div>
    );
  }

  const fieldError =
    state.status === "error" ? (state.reason === "invalid" ? t.invalidEmail : t.sendError) : undefined;
  const banner = initialError === "link" ? t.linkError : initialError === "google" ? t.googleError : undefined;

  return (
    <div className="flex flex-col gap-6">
      {banner && state.status === "idle" ? (
        <p role="alert" className="border-l-2 border-seal bg-surface px-4 py-3 text-sm">
          {banner}
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4" onSubmit={() => setDismissed(false)}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={next} />
        <Input
          label={t.emailLabel}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder={t.emailPlaceholder}
          defaultValue={state.status === "error" ? state.email : undefined}
          error={fieldError}
        />
        <SubmitButton label={t.submit} pending={t.sending} />
      </form>

      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        {t.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="next" value={next} />
        <GoogleButton label={t.google} />
      </form>

      <p className="text-xs leading-relaxed text-muted">{t.terms}</p>
    </div>
  );
}
