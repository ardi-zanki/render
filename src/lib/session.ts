import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/** Cached per-request session lookup (full validation, server-side). */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Require any logged-in user; redirect to /login otherwise. */
export async function requireUser() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Require a verified user; unverified users go to /verify-email. */
export async function requireVerifiedUser() {
  const session = await requireUser();
  if (!session.user.emailVerified) {
    redirect("/verify-email");
  }
  return session;
}

/** Require an admin; non-admins are sent back to the dashboard. */
export async function requireAdmin() {
  const session = await requireVerifiedUser();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}
