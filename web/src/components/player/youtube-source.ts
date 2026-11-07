"use client";

import { loadYoutubeIframeApi } from "./youtube-loader";
import type { PlayerEventHandler, PlayerEventName, VideoSource } from "./video-source";

/**
 * VideoSource sobre o YouTube: IFrame API, host youtube-nocookie.com, controles do YouTube escondidos
 * (controls=0) — os controles próprios do nosso Player ficam por cima, numa camada transparente que
 * bloqueia cliques diretos no iframe (sem cobrir o vídeo nem a marca — ver
 * docs/architecture/index.md, "Riscos aceitos com o YouTube": os termos da API proíbem esconder o player).
 */
export class YouTubeSource implements VideoSource {
  private player: YT.Player | null = null;
  private listeners = new Map<PlayerEventName, Set<PlayerEventHandler>>();
  private timeUpdateInterval: number | undefined;

  async load(container: HTMLElement, ref: string): Promise<void> {
    await loadYoutubeIframeApi();

    await new Promise<void>((resolve, reject) => {
      this.player = new window.YT!.Player(container, {
        videoId: ref,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          controls: 0,
          rel: 0,
          iv_load_policy: 3,
          disablekb: 1,
          playsinline: 1,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            this.startTimeUpdates();
            this.emit("ready");
            resolve();
          },
          onStateChange: (event) => {
            const YTState = window.YT!.PlayerState;
            if (event.data === YTState.PLAYING) this.emit("play");
            else if (event.data === YTState.PAUSED) this.emit("pause");
            else if (event.data === YTState.ENDED) this.emit("ended");
          },
          onError: (event) => {
            this.emit("error", event.data);
            reject(new Error(`youtube_error_${event.data}`));
          },
        },
      });
    });
  }

  private startTimeUpdates() {
    this.timeUpdateInterval = window.setInterval(() => this.emit("timeupdate"), 250);
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  seek(seconds: number): void {
    this.player?.seekTo(seconds, true);
  }

  setVolume(volume: number): void {
    this.player?.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100));
  }

  setPlaybackRate(rate: number): void {
    this.player?.setPlaybackRate(rate);
  }

  get currentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  get duration(): number {
    return this.player?.getDuration() ?? 0;
  }

  on(event: PlayerEventName, handler: PlayerEventHandler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)?.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(event: PlayerEventName, payload?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
  }

  destroy(): void {
    if (this.timeUpdateInterval !== undefined) window.clearInterval(this.timeUpdateInterval);
    this.player?.destroy();
    this.player = null;
    this.listeners.clear();
  }
}
