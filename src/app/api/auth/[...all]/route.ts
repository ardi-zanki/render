import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  assertRateLimit,
  type RateLimitAction,
  RateLimitError,
} from "@/lib/rate-limit";

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
  if (action) {
    try {
      await assertRateLimit(action, clientIp(req));
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
