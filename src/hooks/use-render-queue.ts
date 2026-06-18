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
  prompt: string | null;
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
    const interval = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [intervalMs, refresh]);

  // Dismiss a completed item once the user opens it.
  const markSeen = useCallback((renderId: string) => {
    setSeen((prev) => {
      if (prev.has(renderId)) return prev;
      const next = new Set(prev);
      next.add(renderId);
      persistSeen(next);
      return next;
    });
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
