import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  assertRateLimit,
  type RateLimitAction,
  RateLimitError,
} from "@/lib/rate-limit";
import { isDisposableEmail } from "@/lib/validations/disposable-email";

const handlers = toNextJsHandler(auth);

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function authAction(pathname: string): RateLimitAction | null {
  if (pathname.includes("sign-up")) return "register";
  if (pathname.includes("sign-in")) return "login";
  if (pathname.includes("forget-password")) return "forgot_password";
  if (pathname.includes("forgot-password")) return "forgot_password";
  if (pathname.includes("request-password-reset")) return "forgot_password";
  if (pathname.includes("reset-password")) return "reset_password";
  if (pathname.includes("send-verification")) return "resend_verification";
  return null;
}

export const GET = handlers.GET;

export async function POST(req: Request) {
  const action = authAction(new URL(req.url).pathname);

  // Reject sign-ups from disposable/temporary email providers (server-side
  // guard mirroring registerSchema, so the API is protected directly too).
  if (action === "register") {
    try {
      const body = (await req.clone().json()) as { email?: unknown };
      const email = typeof body.email === "string" ? body.email : "";
      if (email && isDisposableEmail(email)) {
        return NextResponse.json(
          {
            code: "DISPOSABLE_EMAIL",
            message: "Gunakan email permanen, bukan email sementara.",
          },
          { status: 422 },
        );
      }
    } catch {
      // Body not JSON / unreadable — let Better Auth handle validation.
    }
  }

  if (action) {
    let identifier = clientIp(req);
    // Login, forgot-password, and resend are scoped to IP + email (PRD §12.1).
    if (
      action === "login" ||
      action === "forgot_password" ||
      action === "resend_verification"
    ) {
      try {
        const body = (await req.clone().json()) as { email?: unknown };
        const email =
          typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (email) identifier = `${identifier}:${email}`;
      } catch {
        // Body not JSON / unreadable — fall back to IP-only scope.
      }
    }
    try {
      await assertRateLimit(action, identifier);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          {
            success: false,
            code: err.code,
            message: err.message,
          },
          { status: 429 },
        );
      }
      throw err;
    }
  }

  return handlers.POST(req);
}
