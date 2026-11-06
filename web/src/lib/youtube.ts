// Extrai o ID de um vídeo do YouTube a partir de um link (em vários formatos) ou do ID puro.

const idPattern = /^[A-Za-z0-9_-]{11}$/;

/** Host é do YouTube (com ou sem `www`/`m`, incluindo o domínio "sem cookies")? */
function isYoutubeHost(host: string): boolean {
  return /^(www\.|m\.)?(youtube\.com|youtube-nocookie\.com)$/.test(host) || host === "youtu.be";
}

/**
 * Extrai o ID de um link do YouTube em formatos comuns, ou aceita o ID puro já colado.
 * Devolve `null` se não reconhecer.
 *
 * Formatos cobertos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID,
 * youtube-nocookie.com (qualquer um dos caminhos acima), com `www.`/`m.` opcionais e parâmetros extras
 * na URL (ex.: "&t=30s"); também aceita o ID puro de 11 caracteres sem nenhum link em volta.
 */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (idPattern.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!isYoutubeHost(url.hostname)) return null;

  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return idPattern.test(id) ? id : null;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && idPattern.test(fromQuery)) return fromQuery;

  const match = url.pathname.match(/^\/(embed|shorts)\/([A-Za-z0-9_-]{11})/);
  if (match) return match[2];

  return null;
}
