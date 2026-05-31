/**
 * Runtime smoke test for the Phase 1b foundation. Not part of the app — run
 * with `pnpm smoke:auth`. Exercises: Better Auth signup → drizzle adapter →
 * user-create hook → provisioning (profile, balance, default project) →
 * idempotent signup bonus → rate limiter.
 */
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  creditBalances,
  creditTransactions,
  projects,
  user,
  userProfiles,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getBalance } from "@/lib/credits";
import { grantSignupBonus } from "@/lib/provisioning";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL = "smoke+phase1b@renderai.test";

function assert(cond: unknown, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    process.exitCode = 1;
  }
}

async function main() {
  // Clean slate (cascade removes dependent rows).
  await db.delete(user).where(eq(user.email, EMAIL));

  console.log("1) Sign up via Better Auth");
  await auth.api.signUpEmail({
    body: { name: "Smoke Test", email: EMAIL, password: "rahasia123" },
  });

  const u = await db.query.user.findFirst({ where: eq(user.email, EMAIL) });
  assert(u, "user row created");
  if (!u) return;
  assert(u.emailVerified === false, "user starts unverified");
  assert(u.role === "user", "default role is 'user'");

  console.log("2) Provisioning from user-create hook");
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, u.id),
  });
  const balance = await db.query.creditBalances.findFirst({
    where: eq(creditBalances.userId, u.id),
  });
  const defaultProject = await db.query.projects.findFirst({
    where: and(eq(projects.userId, u.id), eq(projects.isDefault, true)),
  });
  assert(profile, "user_profile created");
  assert(balance?.balance === 0, "credit_balance created at 0");
  assert(defaultProject?.name === "Project Saya", "default project created");

  console.log("3) Signup bonus is idempotent");
  const first = await grantSignupBonus(u.id);
  assert(first.applied && first.balance === 3, "first grant → balance 3");
  const second = await grantSignupBonus(u.id);
  assert(!second.applied && second.balance === 3, "second grant is a no-op");
  assert((await getBalance(u.id)) === 3, "final balance is 3");
  const txns = await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, u.id),
  });
  assert(txns.length === 1, "exactly one bonus transaction recorded");

  console.log("4) Rate limiter counts down");
  const r1 = await rateLimit("login", "smoke-ip");
  const r2 = await rateLimit("login", "smoke-ip");
  assert(
    r1.remaining === 9 && r2.remaining === 8,
    `login window decrements (got ${r1.remaining}, ${r2.remaining})`,
  );

  // Cleanup.
  await db.delete(user).where(eq(user.email, EMAIL));
  console.log("\nDone.");
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error("Smoke test error:", err);
  process.exit(1);
});
