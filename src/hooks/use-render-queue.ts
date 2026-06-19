"use client";

import { useCallback, useEffect, useState } from "react";

import type { RenderMode } from "@/db/schema";
import { apiErrorMessage, apiJson } from "@/lib/client-api";

export type RenderQueueItem = {
  id: string;
  renderId: string;
  status: "queued" | "processing" | "success";
  attempts: number;
  maxAttempts: number;
  mode: RenderMode;
  projectName: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type QueueResponse = {
  count: number;
  items: RenderQueueItem[];
};

// Completed renders stay in the panel until the user opens them; we remember
// which ones were opened (per browser) so they don't reappear on refresh.
const SEEN_KEY = "renderai.queue.seen";
export const RENDER_QUEUE_REFRESH_EVENT = "renderai:queue-refresh";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage may be unavailable (private mode); dismissal is best-effort.
  }
}

/** Mark a completed render as opened, including when Studio was opened from
 * somewhere other than the queue popover. */
export function markRenderQueueSeen(renderId: string) {
  const seen = loadSeen();
  if (seen.has(renderId)) return;
  seen.add(renderId);
  persistSeen(seen);
  notifyRenderQueueChanged();
}

export function useRenderQueue(intervalMs = 10_000) {
  const [rawItems, setRawItems] = useState<RenderQueueItem[]>([]);
  const [seen, setSeen] = useState<Set<string>>(loadSeen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await apiJson<QueueResponse>("/api/renders/queue", {
        cache: "no-store",
      });
      setRawItems(json.items);
      // Drop "seen" ids the server no longer returns (aged out of the window)
      // so the set can't grow without bound.
      setSeen((prev) => {
        const present = new Set(
          json.items
            .filter((item) => item.status === "success")
            .map((item) => item.renderId),
        );
        const next = new Set([...prev].filter((id) => present.has(id)));
        if (next.size !== prev.size) persistSeen(next);
        return next;
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat antrean render"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  const hasActiveJob = rawItems.some(
    (item) => item.status === "queued" || item.status === "processing",
  );

  useEffect(() => {
    if (!hasActiveJob) return;
    const interval = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(interval);
  }, [hasActiveJob, intervalMs, refresh]);

  useEffect(() => {
    const onQueueRefresh = () => {
      setSeen(loadSeen());
      void refresh();
    };
    window.addEventListener(RENDER_QUEUE_REFRESH_EVENT, onQueueRefresh);
    return () =>
      window.removeEventListener(RENDER_QUEUE_REFRESH_EVENT, onQueueRefresh);
  }, [refresh]);

  // Dismiss a completed item once the user opens it.
  const markSeen = useCallback((renderId: string) => {
    markRenderQueueSeen(renderId);
  }, []);

  // One entry per render (a render's edits each have their own job row).
  // rawItems is newest-first, so the first job seen per render is the latest.
  const byRender = new Map<string, RenderQueueItem>();
  for (const item of rawItems) {
    if (!byRender.has(item.renderId)) byRender.set(item.renderId, item);
  }
  const items = [...byRender.values()].filter(
    (item) => item.status !== "success" || !seen.has(item.renderId),
  );

  return { count: items.length, items, loading, error, refresh, markSeen };
}

export function notifyRenderQueueChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RENDER_QUEUE_REFRESH_EVENT));
}
