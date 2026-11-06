import type { Device } from "./types";

/** Classifica o dispositivo a partir do User-Agent. Aproximado — não precisa ser perfeito para análise. */
export function detectDevice(userAgent: string): Device {
  const ua = userAgent.toLowerCase();
  if (/smarttv|appletv|googletv|hbbtv|netcast|viera|tizen|webos/.test(ua)) return "tv";
  if (/ipad|tablet|(?:android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(ua)) return "mobile";
  if (/mozilla|windows|macintosh|linux|x11/.test(ua)) return "desktop";
  return "other";
}

/** País de 2 letras a partir dos cabeçalhos de geolocalização da hospedagem (Vercel) ou do Cloudflare. */
export function detectCountry(headers: Headers): string | undefined {
  const raw = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? undefined;
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : undefined;
}
