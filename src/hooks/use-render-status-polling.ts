"use client";

import { useCallback, useEffect, useRef } from "react";

import type { RenderStatus } from "@/db/schema";
import { apiJson } from "@/lib/client-api";

export type PolledRender = {
  status: RenderStatus;
  resultUrl: string | null;
  errorMessage?: string | null;
};

type PollHandlers = {
  onUpdate?: (render: PolledRender) => void;
  onSuccess?: (render: PolledRender) => void;
  onFailure?: (render: PolledRender) => void;
  onTimeout?: () => void;
};

export function useRenderStatusPolling({
  intervalMs = 2_000,
  maxAttempts = 90,
}: {
  intervalMs?: number;
  maxAttempts?: number;
} = {}) {
  const timerRef = useRef<number | null>(null);
  const runIdRef = useRef(0);

  const stopPolling = useCallback(() => {
    runIdRef.current += 1;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (renderId: string, handlers: PollHandlers = {}) => {
      stopPolling();
      const runId = runIdRef.current;
      let attempts = 0;

      const isCurrent = () => runId === runIdRef.current;
      const finish = () => {
        if (timerRef.current != null) {
          window.clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        runIdRef.current += 1;
      };

      const tick = async () => {
        if (!isCurrent()) return;
        attempts += 1;

        try {
          const render = await apiJson<PolledRender>(`/api/renders/${renderId}`, {
            cache: "no-store",
          });
          if (!isCurrent()) return;

          handlers.onUpdate?.(render);

          if (render.status === "success") {
            handlers.onSuccess?.(render);
            finish();
            return;
          }

          if (render.status === "failed") {
            handlers.onFailure?.(render);
            finish();
            return;
          }
        } catch {
          // Temporary API/network errors are tolerated until the timeout.
        }

        if (!isCurrent()) return;
        if (attempts >= maxAttempts) {
          handlers.onTimeout?.();
          finish();
          return;
        }

        timerRef.current = window.setTimeout(tick, intervalMs);
      };

      timerRef.current = window.setTimeout(tick, intervalMs);
    },
    [intervalMs, maxAttempts, stopPolling],
  );

  useEffect(() => stopPolling, [stopPolling]);

  return { startPolling, stopPolling };
}
