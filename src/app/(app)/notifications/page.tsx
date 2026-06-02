import {
  Bell,
  CreditCard,
  Gem,
  Mail,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MarkAllReadButton } from "@/components/app/mark-all-read-button";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import type { NotificationType } from "@/db/schema";
import {
  countNotifications,
  getUnreadCount,
  listNotifications,
} from "@/lib/notifications/service";
import { timeAgo } from "@/lib/notifications/ui";
import { requireVerifiedUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifikasi" };

const ICONS: Record<NotificationType, LucideIcon> = {
  render_success: Sparkles,
  render_failed: XCircle,
  payment_success: CreditCard,
  payment_failed: XCircle,
  low_credit: Gem,
  email_verification: Mail,
  system: Bell,
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { page: pageParam } = await searchParams;
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [items, total, unread] = await Promise.all([
    listNotifications(user.id, pageSize, (page - 1) * pageSize),
    countNotifications(user.id),
    getUnreadCount(user.id),
  ]);
  const totalPages = Math.ceil(total / pageSize);
  const hasUnread = unread > 0;

  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Pemberitahuan render, pembayaran, dan sistem."
        action={hasUnread ? <MarkAllReadButton /> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada notifikasi"
          description="Update render dan pembayaran Anda akan muncul di sini."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-border">
            {items.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <Link
                  key={n.id}
                  href={n.actionUrl ?? "#"}
                  className={cn(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {n.title}
                    </span>
                    {n.message && (
                      <span className="text-sm text-muted-foreground">
                        {n.message}
                      </span>
                    )}
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt.toISOString())}
                    </span>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}
