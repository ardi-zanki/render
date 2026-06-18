import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  account,
  userProfiles,
  type RenderMode,
  type RenderOutputFormat,
} from "@/db/schema";

export type UserPreferencesUpdate = {
  defaultRenderMode: RenderMode;
  defaultOutputFormat: RenderOutputFormat;
};

export async function getUserProfile(userId: string) {
  return db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
}

export async function hasLinkedAccount(userId: string, providerId: string) {
  const [row] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, providerId)))
    .limit(1);

  return Boolean(row);
}

export async function hasGoogleAccount(userId: string) {
  return hasLinkedAccount(userId, "google");
}

export async function hasPasswordAccount(userId: string) {
  const [row] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, "credential"),
        isNotNull(account.password),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function unlinkGoogleAccount(userId: string) {
  await db
    .delete(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "google")));
}

export async function updateUserProfileDisplayName(
  userId: string,
  displayName?: string,
) {
  await db
    .update(userProfiles)
    .set({ displayName: displayName ?? null, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));
}

export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferencesUpdate,
) {
  await db
    .update(userProfiles)
    .set({ ...preferences, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId));
}
