"use client";

import { Box, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import type { RenderMode } from "@/db/schema";
import { MODE_LABEL, STATUS_LABEL } from "@/lib/renders/labels";
import { cn } from "@/lib/utils";

type QueueItem = {
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
  items: QueueItem[];
};

export function RenderQueueButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch("/api/renders/queue", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as QueueResponse;
      setCount(json.count);
      setItems(json.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadQueue(), 0);
    const interval = window.setInterval(loadQueue, 10_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void loadQueue(), 0);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-primary",
          count > 0 && "text-primary",
        )}
        aria-label="Antrian render"
        title="Antrian render"
      >
        <Box className="size-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <Popover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        width={340}
        className="max-h-[min(520px,calc(100vh-2rem))] overflow-y-auto rounded-lg border border-border bg-popover p-3 shadow-[0_16px_48px_rgb(15_23_42/0.14)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-muted-foreground" />
            <p className="font-semibold text-foreground">Antrian Render</p>
          </div>
          <Badge variant={count > 0 ? "warning" : "secondary"}>
            {count} Tugas
          </Badge>
        </div>

        <div className="mt-3">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat antrian
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-8 text-sm text-muted-foreground">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                <Box className="size-5" />
              </span>
              Antrian kosong
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/renders/${item.renderId}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-md border border-border bg-card p-3 transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {MODE_LABEL[item.mode]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.projectName}
                      </p>
                    </div>
                    <Badge
                      variant={item.status === "processing" ? "warning" : "secondary"}
                    >
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    Percobaan {item.attempts}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
}
