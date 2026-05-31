import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic auth guard for protected routes (PRD §10). Only checks for the
 * presence of a session cookie at the edge — full session validation plus
 * email-verified / admin-role checks happen in server components via
 * `requireUser` / `requireVerifiedUser` / `requireAdmin`.
 *
 * Next 16 "proxy" convention (replaces the deprecated `middleware` file).
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/renders/:path*",
    "/payments/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
