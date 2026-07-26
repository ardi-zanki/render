import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { env } from "@/env";
import { auth } from "@/lib/auth";

/** Cached per-request session lookup (full validation, server-side). */
export const getServerSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Require any logged-in, non-disabled user; redirect to /login otherwise. */
export async function requireUser() {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.isDisabled) {
    redirect("/login?disabled=1");
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

function sessionAgeSeconds(createdAt: Date | string) {
  return (Date.now() - new Date(createdAt).getTime()) / 1000;
}

export function isRecentAuthentication(
  createdAt: Date | string,
  maxAgeSec: number = env.SENSITIVE_ACTION_MAX_AGE,
) {
  const age = sessionAgeSeconds(createdAt);
  return Number.isFinite(age) && age >= 0 && age <= maxAgeSec;
}

/**
 * Require an admin; non-admins are sent back to the dashboard. Admin sessions
 * also have a shorter effective lifetime than normal sessions (PRD §10.1):
 * once the session is older than ADMIN_SESSION_MAX_AGE, the admin must re-auth.
 */
export async function requireAdmin() {
  const session = await requireVerifiedUser();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  if (sessionAgeSeconds(session.session.createdAt) > env.ADMIN_SESSION_MAX_AGE) {
    redirect("/login?reauth=admin");
  }
  return session;
}

/**
 * Require the user to have authenticated recently (PRD §10.1 — sensitive action
 * re-auth). Gates high-risk operations (e.g. manual credit adjustment): if the
 * session is older than the window, the user is sent to re-login as a step-up.
 */
export async function requireRecentAuth(
  maxAgeSec: number = env.SENSITIVE_ACTION_MAX_AGE,
) {
  const session = await requireUser();
  if (!isRecentAuthentication(session.session.createdAt, maxAgeSec)) {
    redirect("/login?reauth=sensitive");
  }
  return session;
}
