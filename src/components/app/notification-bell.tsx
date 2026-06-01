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
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { NotificationType } from "@/db/schema";
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
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);

  async function post(body: { id: string } | { all: true }) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
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
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        aria-label="Notifikasi"
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-[0_16px_48px_rgb(15_23_42/0.14)]">
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
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                        !n.isRead && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
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
                        <span className="mt-0.5 text-[11px] text-muted-foreground">
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
          </div>
        </>
      )}
    </div>
  );
}
