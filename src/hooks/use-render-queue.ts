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

export const RENDER_QUEUE_REFRESH_EVENT = "renderai:queue-refresh";

/** Persist queue acknowledgement on the server so it survives local storage
 * clearing, logout, and switching devices. */
export async function markRenderQueueSeen(renderId: string) {
  try {
    await apiJson("/api/renders/queue/read", {
      method: "POST",
      body: JSON.stringify({ renderId }),
    });
    notifyRenderQueueChanged();
    return true;
  } catch {
    return false;
  }
}

export function useRenderQueue(intervalMs = 10_000) {
  const [rawItems, setRawItems] = useState<RenderQueueItem[]>([]);
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
    const onQueueRefresh = () => void refresh();
    window.addEventListener(RENDER_QUEUE_REFRESH_EVENT, onQueueRefresh);
    return () =>
      window.removeEventListener(RENDER_QUEUE_REFRESH_EVENT, onQueueRefresh);
  }, [refresh]);

  // Dismiss a completed item once the user opens it.
  const markSeen = useCallback(
    async (renderId: string) => {
      setRawItems((current) =>
        current.filter((item) => item.renderId !== renderId),
      );
      if (!(await markRenderQueueSeen(renderId))) await refresh();
    },
    [refresh],
  );

  // One entry per render (a render's edits each have their own job row).
  // rawItems is newest-first, so the first job seen per render is the latest.
  const byRender = new Map<string, RenderQueueItem>();
  for (const item of rawItems) {
    if (!byRender.has(item.renderId)) byRender.set(item.renderId, item);
  }
  const items = [...byRender.values()];

  return { count: items.length, items, loading, error, refresh, markSeen };
}

export function notifyRenderQueueChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RENDER_QUEUE_REFRESH_EVENT));
}
