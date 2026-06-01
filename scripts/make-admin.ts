/**
 * Promote (or create) an admin user. Run with:
 *   pnpm make:admin [email] [password] [name]
 * Defaults: admin@renderai.test / admin12345 / "Admin RenderAI".
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { provisionNewUser } from "@/lib/provisioning";

const email = process.argv[2] ?? "admin@renderai.test";
const password = process.argv[3] ?? "admin12345";
const name = process.argv[4] ?? "Admin RenderAI";

async function main() {
  let u = await db.query.user.findFirst({ where: eq(user.email, email) });

  if (!u) {
    await auth.api.signUpEmail({ body: { name, email, password } });
    u = await db.query.user.findFirst({ where: eq(user.email, email) });
  }
  if (!u) throw new Error("Gagal membuat user");

  await db
    .update(user)
    .set({ role: "admin", emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, u.id));
  await provisionNewUser(u.id, name);

  console.log(`✓ ${email} sekarang ADMIN (verified). Password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("make-admin error:", err);
  process.exit(1);
});
