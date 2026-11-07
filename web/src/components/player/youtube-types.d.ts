// Tipos mínimos da IFrame Player API do YouTube — só o que o YouTubeSource usa.
// https://developers.google.com/youtube/iframe_api_reference

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}

declare namespace YT {
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  interface OnReadyEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: PlayerState;
    target: Player;
  }

  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  interface PlayerOptions {
    videoId?: string;
    host?: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: OnReadyEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onError?: (event: OnErrorEvent) => void;
    };
  }

  class Player {
    constructor(element: HTMLElement | string, options: PlayerOptions);
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    setVolume(volume: number): void;
    setPlaybackRate(rate: number): void;
    destroy(): void;
  }
}
