import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";

import { db, dbClient } from "../../src/db";
import { user, userProfiles } from "../../src/db/schema";
import { auth } from "../../src/lib/auth";
import { grantSignupBonus } from "../../src/lib/provisioning";
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./test-user";

loadEnv({ path: ".env.local", override: false });

process.env.AI_PROVIDER = "mock";
process.env.APP_URL = "http://localhost:3210";
process.env.BETTER_AUTH_URL = "http://localhost:3210";
process.env.PAYMENT_PROVIDER = "mock";
process.env.RATE_LIMIT_ENABLED = "false";
process.env.STORAGE_PROVIDER = "local";

export default async function globalSetup() {
  await db.delete(user).where(eq(user.email, E2E_USER_EMAIL));

  await auth.api.signUpEmail({
    body: {
      name: "E2E Render User",
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
    },
  });

  const created = await db.query.user.findFirst({
    where: eq(user.email, E2E_USER_EMAIL),
  });
  if (!created) throw new Error("Gagal membuat user E2E");

  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, created.id));
  await db
    .update(userProfiles)
    .set({ emailNotificationsEnabled: false, updatedAt: new Date() })
    .where(eq(userProfiles.userId, created.id));
  await grantSignupBonus(created.id);

  await dbClient.end({ timeout: 5 });
}
