// Consentimento de análise, guardado em cookie do navegador.
// O banner para pedir o consentimento chega com o Épico 9; até lá o padrão é "sem consentimento".

export const consentCookie = "consent";

export type Consent = { analytics: boolean; marketing: boolean };

export const noConsent: Consent = { analytics: false, marketing: false };

/** Lê o valor do cookie de consentimento (formato `a=1&m=0`). Qualquer valor inesperado vira "sem consentimento". */
export function parseConsent(raw: string | null | undefined): Consent {
  if (!raw) return noConsent;
  const params = new URLSearchParams(raw);
  return { analytics: params.get("a") === "1", marketing: params.get("m") === "1" };
}

export function serializeConsent(consent: Consent): string {
  return `a=${consent.analytics ? 1 : 0}&m=${consent.marketing ? 1 : 0}`;
}

export function readConsent(): Consent {
  if (typeof document === "undefined") return noConsent;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${consentCookie}=`));
  if (!match) return noConsent;
  try {
    return parseConsent(decodeURIComponent(match.slice(consentCookie.length + 1)));
  } catch {
    return noConsent;
  }
}

export function writeConsent(consent: Consent): void {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${consentCookie}=${encodeURIComponent(serializeConsent(consent))}; path=/; max-age=${oneYear}; samesite=lax`;
}
