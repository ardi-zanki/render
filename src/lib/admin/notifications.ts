import { count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { notifications, user } from "@/db/schema";

export async function listAllNotifications(limit = 100, offset = 0) {
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
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countAllNotifications(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(notifications);
  return row.value;
}
