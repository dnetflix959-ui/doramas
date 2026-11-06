// Validação de um arquivo de legenda antes de enviar ao Storage (bucket "legendas", story 2.4).

export const MAX_SUBTITLE_BYTES = 262_144; // 256 KB — igual ao file_size_limit do bucket.

export type SubtitleFileError = "extension" | "size" | "empty";

/** Confere extensão (`.vtt`) e tamanho. Não confia no `Content-Type` do navegador, que nem sempre é exato. */
export function validateSubtitleFile(file: { name: string; size: number }): SubtitleFileError | null {
  if (!file.name || file.size === 0) return "empty";
  if (!file.name.toLowerCase().endsWith(".vtt")) return "extension";
  if (file.size > MAX_SUBTITLE_BYTES) return "size";
  return null;
}
