// Carrega a IFrame API do YouTube uma única vez por página, mesmo com vários players tentando ao mesmo tempo.

let apiPromise: Promise<void> | null = null;

export function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("youtube_api_requires_browser"));
  }
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiPromise;
}
