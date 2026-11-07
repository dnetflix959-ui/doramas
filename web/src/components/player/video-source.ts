// Contrato que qualquer provedor de vídeo (YouTube, Bunny) precisa implementar — troca de provedor sem
// reescrever o player (NFR6, docs/architecture/index.md).

export type PlayerEventName = "ready" | "play" | "pause" | "ended" | "error" | "timeupdate";
export type PlayerEventHandler = (payload?: unknown) => void;

export interface VideoSource {
  /** Monta o player dentro do elemento e carrega o vídeo. Resolve quando está pronto para tocar. */
  load(container: HTMLElement, ref: string): Promise<void>;
  play(): void;
  pause(): void;
  /** Pula para um tempo absoluto, em segundos. */
  seek(seconds: number): void;
  /** 0–1 */
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  readonly currentTime: number;
  readonly duration: number;
  /** Devolve uma função para cancelar a inscrição. */
  on(event: PlayerEventName, handler: PlayerEventHandler): () => void;
  destroy(): void;
}
