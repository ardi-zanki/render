"use client";

import {
  Bell,
  CreditCard,
  Gem,
  Mail,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import type { NotificationType } from "@/db/schema";
import { postJson } from "@/lib/client-api";
import { timeAgo, type NotificationItem } from "@/lib/notifications/ui";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, LucideIcon> = {
  render_success: Sparkles,
  render_failed: XCircle,
  payment_success: CreditCard,
  payment_failed: XCircle,
  low_credit: Gem,
  email_verification: Mail,
  system: Bell,
};

export function NotificationBell({
  initialUnread,
  items,
}: {
  initialUnread: number;
  items: NotificationItem[];
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  async function post(body: { id: string } | { all: true }) {
    try {
      await postJson("/api/notifications/read", body);
      router.refresh();
    } catch {
      // Optimistic unread state is refreshed on the next server navigation.
    }
  }

  function onItem(n: NotificationItem) {
    if (!n.isRead) {
      setUnread((u) => Math.max(0, u - 1));
      void post({ id: n.id });
    }
    setOpen(false);
    if (n.actionUrl) router.push(n.actionUrl);
  }

  function markAll() {
    setUnread(0);
    void post({ all: true });
  }

  return (
    <div ref={triggerRef} className="relative">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Notifikasi"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-micro font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      <Popover
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        width={320}
        className="overflow-hidden rounded-lg border border-border/80 bg-popover shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-semibold text-foreground">Notifikasi</span>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada notifikasi.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => onItem(n)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/80",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {n.title}
                    </span>
                    {n.message && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </span>
                    )}
                    <span className="mt-0.5 text-micro text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.isRead && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <a
          href="/notifications"
          className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:underline"
        >
          Lihat semua
        </a>
      </Popover>
    </div>
  );
}
