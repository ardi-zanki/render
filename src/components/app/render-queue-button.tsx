"use client";

import { Box, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { useRenderQueue, type RenderQueueItem } from "@/hooks/use-render-queue";
import { apiErrorMessage, apiJson } from "@/lib/client-api";
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
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());
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

  async function onCancel(item: RenderQueueItem) {
    setCancelError("");
    setCancelling((prev) => new Set(prev).add(item.renderId));
    try {
      await apiJson(`/api/renders/${item.renderId}/cancel`, {
        method: "POST",
      });
      await refresh();
    } catch (err) {
      setCancelError(apiErrorMessage(err, "Gagal membatalkan render"));
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(item.renderId);
        return next;
      });
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
        aria-label="Antrean render"
        title="Antrean render"
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
            <p className="font-semibold text-foreground">Antrean render</p>
          </div>
          <Badge variant={count > 0 ? "warning" : "secondary"}>
            {count} Tugas
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto p-3">
          {error || cancelError ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error || cancelError}
            </div>
          ) : loading && items.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Memuat antrean
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-6 text-sm text-muted-foreground">
              <span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
                <Box className="size-4" />
              </span>
              Antrean kosong
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const done = item.status === "success";
                const isCancelling = cancelling.has(item.renderId);
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-border bg-card p-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onItem(item)}
                        className="min-w-0 flex-1 text-left"
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
                              Percobaan {item.attempts}/{item.maxAttempts}
                            </>
                          )}
                        </div>
                      </button>
                      {!done && (
                        <button
                          type="button"
                          onClick={() => void onCancel(item)}
                          disabled={isCancelling}
                          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Batalkan render"
                          title="Batalkan render"
                        >
                          {isCancelling ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
}
