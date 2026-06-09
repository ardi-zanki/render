import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { account, userProfiles } from "@/db/schema";

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
