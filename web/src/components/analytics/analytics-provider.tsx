"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { flush, startTracking, track } from "@/lib/analytics/track";

/** Liga a coleta de eventos: page_view a cada troca de página, envio periódico e ao fechar a aba. */
export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => startTracking(), []);

  useEffect(() => {
    // Antes de registrar a nova página, envia o que ficou da anterior.
    flush();
    track("page_view");
  }, [pathname]);

  useEffect(() => {
    const onError = (event: ErrorEvent) =>
      track("client_error", { message: String(event.message).slice(0, 200) });
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  return null;
}
