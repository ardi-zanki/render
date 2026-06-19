"use client";

import { Box, CheckCircle2, Clock3, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Popover } from "@/components/ui/popover";
import { useRenderQueue, type RenderQueueItem } from "@/hooks/use-render-queue";
import { ApiClientError, apiErrorMessage, apiJson } from "@/lib/client-api";
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
  const [confirmCancel, setConfirmCancel] = useState<RenderQueueItem | null>(
    null,
  );
  const { count, items, loading, error, refresh, markSeen } = useRenderQueue();

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  async function onItem(item: RenderQueueItem) {
    setOpen(false);
    if (item.status === "success") {
      // Opening a finished render dismisses it from the queue, then lands in
      // the studio to view the result.
      await markSeen(item.renderId);
      router.push(`/renders/new?source=${item.renderId}`);
    } else {
      router.push(`/renders/${item.renderId}`);
    }
  }

  async function cancelRender(item: RenderQueueItem) {
    setCancelError("");
    setCancelling((prev) => new Set(prev).add(item.renderId));
    try {
      await apiJson(`/api/renders/${item.renderId}/cancel`, {
        method: "POST",
      });
      await refresh();
      return true;
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        await refresh();
        return true;
      }
      setCancelError(apiErrorMessage(err, "Gagal membatalkan render"));
      return false;
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
          "relative flex size-8 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-card text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary",
          count > 0 && "text-primary",
        )}
        aria-label="Antrean render"
        title="Antrean render"
      >
        <Box className="size-3.5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-micro font-bold leading-3.5 text-primary-foreground">
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
          {(error || cancelError) && (
            <div className="mb-3 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error || cancelError}
            </div>
          )}

          {loading && items.length === 0 ? (
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
                const progress =
                  item.maxAttempts > 0
                    ? Math.min(100, (item.attempts / item.maxAttempts) * 100)
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-md border border-border/80 bg-card px-3 py-3 shadow-soft transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                  onClick={() => void onItem(item)}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-5 text-foreground">
                            {MODE_LABEL[item.mode]}
                          </p>
                          <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
                            {item.projectName}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          {done ? (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              Selesai
                              {item.completedAt && ` · ${timeAgo(item.completedAt)}`}
                            </>
                          ) : (
                            <>
                              <Clock3 className="size-3.5" />
                              Percobaan {item.attempts} dari {item.maxAttempts}
                            </>
                          )}
                        </div>
                        {!done && (
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-warning"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </button>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge
                          variant={statusBadgeVariant(item.status)}
                          className="h-7 shrink-0 px-2.5"
                        >
                          {STATUS_LABEL[item.status]}
                        </Badge>
                        {!done && (
                          <button
                            type="button"
                            onClick={() => setConfirmCancel(item)}
                            disabled={isCancelling}
                            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Batalkan render"
                            title="Batalkan render"
                          >
                            {isCancelling ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <X className="size-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Popover>

      {confirmCancel && (
        <ConfirmDialog
          title="Batalkan render?"
          description={`Proses ${MODE_LABEL[confirmCancel.mode]} di ${confirmCancel.projectName} akan dihentikan. Kredit yang sudah dipakai akan dikembalikan otomatis.`}
          confirmLabel="Batalkan render"
          destructive
          onConfirm={async () => {
            const ok = await cancelRender(confirmCancel);
            if (ok) setConfirmCancel(null);
          }}
          onClose={() => setConfirmCancel(null)}
        />
      )}
    </>
  );
}
