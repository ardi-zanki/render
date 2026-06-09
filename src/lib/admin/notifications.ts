import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { notifications, user, type NotificationType } from "@/db/schema";

export type AdminNotificationFilters = {
  q?: string;
  type?: NotificationType;
  status?: "read" | "unread";
};

function notificationWhere(filters: AdminNotificationFilters = {}) {
  const search = filters.q?.trim();
  return and(
    filters.type ? eq(notifications.type, filters.type) : undefined,
    filters.status === "read" ? eq(notifications.isRead, true) : undefined,
    filters.status === "unread" ? eq(notifications.isRead, false) : undefined,
    search
      ? or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
          ilike(notifications.title, `%${search}%`),
          ilike(notifications.message, `%${search}%`),
        )
      : undefined,
  );
}

export async function listAllNotifications(
  limit = 100,
  offset = 0,
  filters: AdminNotificationFilters = {},
) {
  return db
    .select({
      id: notifications.id,
      userName: user.name,
      type: notifications.type,
      title: notifications.title,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(user, eq(user.id, notifications.userId))
    .where(notificationWhere(filters))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllNotifications(
  filters: AdminNotificationFilters = {},
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .innerJoin(user, eq(user.id, notifications.userId))
    .where(notificationWhere(filters));
  return row.value;
}
