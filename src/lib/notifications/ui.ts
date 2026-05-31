import type { NotificationType } from "@/db/schema";

/** Serializable notification shape passed to client components. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string; // ISO
}

/** Compact Indonesian relative time. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
