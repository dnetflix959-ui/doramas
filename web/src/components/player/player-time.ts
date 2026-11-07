// Funções puras do player (sem DOM) — fáceis de testar com Vitest, igual ao padrão de src/lib/.

/** Formata segundos como "m:ss", ou "h:mm:ss" se passar de 1 hora. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Posição da barra de progresso em porcentagem (0–100). */
export function progressPercent(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}

/** Converte uma posição de clique/arraste na barra (0–1) para segundos. */
export function positionToSeconds(ratio: number, duration: number): number {
  const clamped = Math.min(1, Math.max(0, ratio));
  return clamped * (Number.isFinite(duration) && duration > 0 ? duration : 0);
}

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/** Próxima velocidade de reprodução, ciclando pela lista (volta para a primeira depois da última). */
export function nextPlaybackRate(current: number): number {
  const idx = PLAYBACK_RATES.indexOf(current as (typeof PLAYBACK_RATES)[number]);
  return PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length] ?? 1;
}
