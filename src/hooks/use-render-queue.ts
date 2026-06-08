"use client";

import { useCallback, useEffect, useState } from "react";

import type { RenderMode } from "@/db/schema";
import { apiErrorMessage, apiJson } from "@/lib/client-api";

export type RenderQueueItem = {
  id: string;
  renderId: string;
  status: "queued" | "processing";
  attempts: number;
  mode: RenderMode;
  prompt: string | null;
  projectName: string;
  createdAt: string;
  startedAt: string | null;
};

type QueueResponse = {
  count: number;
  items: RenderQueueItem[];
};

export function useRenderQueue(intervalMs = 10_000) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<RenderQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await apiJson<QueueResponse>("/api/renders/queue", {
        cache: "no-store",
      });
      setCount(json.count);
      setItems(json.items);
    } catch (err) {
      setError(apiErrorMessage(err, "Gagal memuat antrian render"));
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

  return { count, items, loading, error, refresh };
}
