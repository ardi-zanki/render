import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { env } from "@/env";

export interface RateLimitRule {
  limit: number;
  windowSec: number;
}

/** Rate limit rules (PRD §12.1). */
export const RATE_LIMITS = {
  register: { limit: 5, windowSec: 600 },
  login: { limit: 10, windowSec: 600 },
  forgot_password: { limit: 3, windowSec: 900 },
  reset_password: { limit: 5, windowSec: 900 },
  resend_verification: { limit: 3, windowSec: 900 },
  upload_image: { limit: 20, windowSec: 600 },
  create_render: { limit: 10, windowSec: 600 },
  create_payment: { limit: 10, windowSec: 600 },
  payment_sync: { limit: 30, windowSec: 60 },
  payment_webhook: { limit: 120, windowSec: 60 },
  admin_action: { limit: 60, windowSec: 60 },
  public_api: { limit: 60, windowSec: 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly resetAt: Date;
  constructor(resetAt: Date) {
    super("Terlalu banyak percobaan. Silakan coba lagi beberapa saat.");
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

/**
 * Database-backed fixed-window rate limiter (PRD §12.3 — MVP driver). Keyed by
 * `action:identifier` where identifier is typically an IP, user id, or both.
 */
export async function rateLimit(
  action: RateLimitAction,
  identifier: string,
): Promise<RateLimitResult> {
  const rule = RATE_LIMITS[action];
  const now = new Date();
  const key = `${action}:${identifier}`;

  if (!env.RATE_LIMIT_ENABLED) {
    return {
      success: true,
      limit: rule.limit,
      remaining: rule.limit,
      resetAt: new Date(now.getTime() + rule.windowSec * 1000),
    };
  }

  return db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .for("update");
    const row = existing[0];

    // Fresh window: row missing or expired.
    if (!row || row.windowEnd.getTime() <= now.getTime()) {
      const windowEnd = new Date(now.getTime() + rule.windowSec * 1000);
      await tx
        .insert(rateLimits)
        .values({
          key,
          scope: action,
          count: 1,
          windowStart: now,
          windowEnd,
        })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: 1,
            scope: action,
            windowStart: now,
            windowEnd,
            updatedAt: now,
          },
        });
      return {
        success: true,
        limit: rule.limit,
        remaining: rule.limit - 1,
        resetAt: windowEnd,
      };
    }

    if (row.count >= rule.limit) {
      return {
        success: false,
        limit: rule.limit,
        remaining: 0,
        resetAt: row.windowEnd,
      };
    }

    await tx
      .update(rateLimits)
      .set({ count: row.count + 1, updatedAt: now })
      .where(eq(rateLimits.key, key));
    return {
      success: true,
      limit: rule.limit,
      remaining: rule.limit - (row.count + 1),
      resetAt: row.windowEnd,
    };
  });
}

/** Like {@link rateLimit} but throws {@link RateLimitError} when exceeded. */
export async function assertRateLimit(
  action: RateLimitAction,
  identifier: string,
) {
  const result = await rateLimit(action, identifier);
  if (!result.success) {
    throw new RateLimitError(result.resetAt);
  }
  return result;
}
