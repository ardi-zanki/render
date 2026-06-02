import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  user,
  userProfiles,
  type NotificationType,
} from "@/db/schema";
import { sendTransactionalEmail } from "@/lib/email";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  actionUrl?: string;
}

export async function createNotification(p: CreateNotificationParams) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: p.userId,
      type: p.type,
      title: p.title,
      message: p.message,
      actionUrl: p.actionUrl,
    })
    .returning();
  return row;
}

export interface NotifyParams extends CreateNotificationParams {
  /** When set, also send an email (gated by the user's preference). */
  email?: { subject: string; html: string };
}

/**
 * Create an in-app notification and, when an email payload is provided, send it
 * too — respecting `user_profiles.emailNotificationsEnabled`. Never throws on
 * email failure (notifications must not break the originating flow).
 */
export async function notifyUser(p: NotifyParams) {
  await createNotification(p);

  if (!p.email) return;

  try {
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, p.userId),
    });
    if (profile && profile.emailNotificationsEnabled === false) return;

    const u = await db.query.user.findFirst({
      where: eq(user.id, p.userId),
    });
    if (!u) return;

    await sendTransactionalEmail({
      userId: p.userId,
      type: p.type,
      to: u.email,
      subject: p.email.subject,
      html: p.email.html,
    });
  } catch (err) {
    console.warn("notifyUser: gagal kirim email", err);
  }
}

export async function listNotifications(
  userId: string,
  limit = 50,
  offset = 0,
) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: desc(notifications.createdAt),
    limit,
    offset,
  });
}

export async function countNotifications(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(eq(notifications.userId, userId));
  return row.value;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
  return row.value;
}

export async function markRead(userId: string, id: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}
