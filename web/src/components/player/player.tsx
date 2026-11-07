"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatTime, nextPlaybackRate, positionToSeconds, progressPercent } from "./player-time";
import { YouTubeSource } from "./youtube-source";
import type { VideoSource } from "./video-source";

type PlayResponse = { provider: string; ref: string };
type LoadState = "loading" | "ready" | "error";

/**
 * Player com controles próprios sobre o vídeo do YouTube. Busca `{ provider, ref }` em `/api/play/{episodeId}`
 * (story 3.1) — nunca recebe nem expõe o `video_ref` fora dessa chamada.
 */
export function Player({ episodeId }: { episodeId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<VideoSource | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    async function setup() {
      setState("loading");
      setErrorMessage(null);

      let payload: PlayResponse;
      try {
        const res = await fetch(`/api/play/${episodeId}`);
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `http_${res.status}`);
        }
        payload = (await res.json()) as PlayResponse;
      } catch {
        if (!cancelled) {
          setErrorMessage("Não foi possível carregar este episódio.");
          setState("error");
        }
        return;
      }

      if (cancelled) return;

      if (payload.provider !== "youtube") {
        setErrorMessage("Provedor de vídeo ainda não suportado pelo player.");
        setState("error");
        return;
      }

      if (!containerRef.current) return;

      const source = new YouTubeSource();
      sourceRef.current = source;

      unsubscribers.push(source.on("play", () => setPlaying(true)));
      unsubscribers.push(source.on("pause", () => setPlaying(false)));
      unsubscribers.push(source.on("ended", () => setPlaying(false)));
      unsubscribers.push(
        source.on("timeupdate", () => {
          setCurrentTime(source.currentTime);
          setDuration(source.duration);
        }),
      );
      unsubscribers.push(
        source.on("error", () => {
          if (!cancelled) {
            setErrorMessage("Não foi possível reproduzir este vídeo.");
            setState("error");
          }
        }),
      );

      try {
        await source.load(containerRef.current, payload.ref);
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) {
          setErrorMessage("Não foi possível reproduzir este vídeo.");
          setState("error");
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      sourceRef.current?.destroy();
      sourceRef.current = null;
    };
  }, [episodeId]);

  const togglePlay = useCallback(() => {
    if (!sourceRef.current) return;
    if (playing) sourceRef.current.pause();
    else sourceRef.current.play();
  }, [playing]);

  const toggleMute = useCallback(() => {
    setMuted((wasMuted) => {
      const next = !wasMuted;
      sourceRef.current?.setVolume(next ? 0 : volume);
      return next;
    });
  }, [volume]);

  const changeVolume = useCallback((next: number) => {
    setVolumeState(next);
    setMuted(next === 0);
    sourceRef.current?.setVolume(next);
  }, []);

  const changeRate = useCallback(() => {
    setRate((current) => {
      const next = nextPlaybackRate(current);
      sourceRef.current?.setPlaybackRate(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void wrapperRef.current.requestFullscreen();
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function handleSeekClick(event: MouseEvent<HTMLDivElement>) {
    if (!sourceRef.current || duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    sourceRef.current.seek(positionToSeconds(ratio, duration));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!sourceRef.current) return;
    switch (event.key) {
      case " ":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        sourceRef.current.seek(Math.min(duration, currentTime + 10));
        break;
      case "ArrowLeft":
        sourceRef.current.seek(Math.max(0, currentTime - 10));
        break;
      case "m":
      case "M":
        toggleMute();
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      default:
        break;
    }
  }

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative aspect-video w-full overflow-hidden rounded-md bg-black outline-none"
    >
      <div ref={containerRef} className="absolute inset-0" />

      {/* Camada transparente: bloqueia cliques diretos no iframe do YouTube; os controles ficam por cima.
          Não cobre o vídeo nem a marca (termos da API — ver docs/architecture/index.md). */}
      {state === "ready" ? (
        <button
          type="button"
          aria-label={playing ? "Pausar" : "Reproduzir"}
          onClick={togglePlay}
          className="absolute inset-0 cursor-pointer bg-transparent"
        />
      ) : null}

      {state === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          Carregando…
        </div>
      ) : null}

      {state === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center text-sm text-white/85">
          {errorMessage}
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div
            role="slider"
            aria-label="Progresso"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            onClick={handleSeekClick}
            className="pointer-events-auto h-1.5 w-full cursor-pointer rounded-full bg-white/25"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progressPercent(currentTime, duration)}%` }}
            />
          </div>

          <div className="pointer-events-auto flex items-center gap-3 text-white">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"}>
              {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>

            <button type="button" onClick={toggleMute} aria-label={muted ? "Ativar som" : "Mudo"}>
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
              className="w-20 accent-accent"
            />

            <span className="text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button type="button" onClick={changeRate} className="ml-auto text-xs font-semibold">
              {rate}×
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
