import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { creditBalances, projects, userProfiles } from "@/db/schema";
import { applyCreditChange } from "@/lib/credits";

/** Free credits granted once after email verification (PRD §22.1). */
export const FREE_SIGNUP_CREDITS = 3;
export const DEFAULT_PROJECT_NAME = "Project Saya";

/**
 * Create the per-user records every account needs: profile, a zero credit
 * balance, and the default project (PRD §16.1). Idempotent.
 */
export async function provisionNewUser(userId: string, displayName?: string) {
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });
  if (!existingProfile) {
    await db
      .insert(userProfiles)
      .values({ userId, displayName })
      .onConflictDoNothing();
  }

  const existingBalance = await db.query.creditBalances.findFirst({
    where: eq(creditBalances.userId, userId),
  });
  if (!existingBalance) {
    await db
      .insert(creditBalances)
      .values({ userId, balance: 0 })
      .onConflictDoNothing();
  }

  const existingDefault = await db.query.projects.findFirst({
    where: and(eq(projects.userId, userId), eq(projects.isDefault, true)),
  });
  if (!existingDefault) {
    await db.insert(projects).values({
      userId,
      name: DEFAULT_PROJECT_NAME,
      isDefault: true,
    });
  }
}

/**
 * Grant the one-time signup bonus. Idempotent via a fixed idempotency key, so
 * it can be safely called from multiple auth callbacks.
 */
export async function grantSignupBonus(userId: string) {
  return applyCreditChange({
    userId,
    type: "bonus",
    amount: FREE_SIGNUP_CREDITS,
    description: `Bonus ${FREE_SIGNUP_CREDITS} kredit gratis`,
    idempotencyKey: `signup-bonus:${userId}`,
  });
}
