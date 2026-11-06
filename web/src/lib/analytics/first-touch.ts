import type { FirstTouch } from "./types";

const storageKey = "first_touch";
const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const maxValueLength = 100;

/** Extrai UTM, origem (referrer) e página de entrada de uma visita. Valores são cortados para não inflar o banco. */
export function buildFirstTouch(url: URL, referrer: string): FirstTouch {
  const touch: FirstTouch = { landing_path: (url.pathname + url.search).slice(0, 300) };
  for (const key of utmKeys) {
    const value = url.searchParams.get(key);
    if (value) touch[key] = value.slice(0, maxValueLength);
  }
  if (referrer) {
    try {
      const ref = new URL(referrer);
      // Só o domínio de origem; ignora navegação interna.
      if (ref.host !== url.host) touch.referrer = ref.host.slice(0, maxValueLength);
    } catch {
      // referrer inválido: ignora
    }
  }
  return touch;
}

/**
 * Guarda a origem da primeira visita (uma vez só) para atribuição. Só chamar com consentimento de análise.
 * Devolve o que está guardado.
 */
export function captureFirstTouch(): FirstTouch | undefined {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved) as FirstTouch;

    const touch = buildFirstTouch(new URL(window.location.href), document.referrer);
    window.localStorage.setItem(storageKey, JSON.stringify(touch));
    return touch;
  } catch {
    // Armazenamento bloqueado (modo privado etc.): segue sem atribuição.
    return undefined;
  }
}

/** Lê a origem guardada sem criar uma nova. */
export function readFirstTouch(): FirstTouch | undefined {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? (JSON.parse(saved) as FirstTouch) : undefined;
  } catch {
    return undefined;
  }
}
