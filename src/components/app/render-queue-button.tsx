"use client";

import { Box, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { useRenderQueue, type RenderQueueItem } from "@/hooks/use-render-queue";
import { timeAgo } from "@/lib/notifications/ui";
import {
  MODE_LABEL,
  STATUS_LABEL,
  statusBadgeVariant,
} from "@/lib/renders/labels";
import { cn } from "@/lib/utils";

export function RenderQueueButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { count, items, loading, error, refresh, markSeen } = useRenderQueue();

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  function onItem(item: RenderQueueItem) {
    setOpen(false);
    if (item.status === "success") {
      // Opening a finished render dismisses it from the queue, then lands in
      // the studio to view the result.
      markSeen(item.renderId);
      router.push(`/renders/new?source=${item.renderId}`);
    } else {
      router.push(`/renders/${item.renderId}`);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex size-9 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary",
          count > 0 && "text-primary",
        )}
        aria-label="Antrian render"
        title="Antrian render"
      >
        <Box className="size-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-micro font-bold leading-4 text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <Popover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        width={340}
        className="overflow-hidden rounded-lg border border-border/80 bg-popover shadow-elevated"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-muted-foreground" />
            <p className="font-semibold text-foreground">Antrian Render</p>
          </div>
          <Badge variant={count > 0 ? "warning" : "secondary"}>
            {count} Tugas
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto p-3">
          {error ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat antrian
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-sm text-muted-foreground">
              <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                <Box className="size-4" />
              </span>
              Antrian kosong
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const done = item.status === "success";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItem(item)}
                    className="block w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-muted/60"
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
                      <Badge variant={statusBadgeVariant(item.status)}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {done ? (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Selesai
                          {item.completedAt && ` · ${timeAgo(item.completedAt)}`}
                        </>
                      ) : (
                        <>
                          <Clock className="size-3.5" />
                          Percobaan {item.attempts}
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
}
