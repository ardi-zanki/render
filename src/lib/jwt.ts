import { createHash, randomUUID } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { db } from "@/db";
import { authTokens, type AuthTokenType } from "@/db/schema";
import { env } from "@/env";

const secret = new TextEncoder().encode(env.JWT_SECRET);

/** Token lifetimes in seconds (PRD §11.1). */
export const TOKEN_TTL: Record<AuthTokenType, number> = {
  email_verification: 60 * 60 * 24,
  password_reset: 60 * 30,
  signed_download: 60 * 10,
  temporary_upload: 60 * 15,
  api_access: 60 * 15,
};

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenError";
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface IssueTokenOptions {
  type: AuthTokenType;
  userId?: string;
  claims?: Record<string, unknown>;
  /** Track in auth_tokens for single-use enforcement (default true). */
  singleUse?: boolean;
}

/**
 * Issue a short-lived JWT with a jti. For single-use tokens we store only a
 * hash of the token plus the jti (PRD §11.2 — never store the raw token).
 */
export async function issueToken(opts: IssueTokenOptions) {
  const jti = randomUUID();
  const ttl = TOKEN_TTL[opts.type];
  const nowSec = Math.floor(Date.now() / 1000);
  const expSec = nowSec + ttl;

  const token = await new SignJWT({ ...opts.claims, tokenType: opts.type })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt(nowSec)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(expSec)
    .setSubject(opts.userId ?? "anonymous")
    .sign(secret);

  if (opts.singleUse ?? true) {
    await db.insert(authTokens).values({
      userId: opts.userId,
      type: opts.type,
      jti,
      tokenHash: hashToken(token),
      expiresAt: new Date(expSec * 1000),
    });
  }

  return { token, jti };
}

export interface VerifyTokenResult extends JWTPayload {
  tokenType?: AuthTokenType;
}

/**
 * Verify signature + claims, and (for single-use tokens) check the jti hasn't
 * been used/revoked/expired. Does not consume the token — call
 * `consumeToken(jti)` after the action succeeds.
 */
export async function verifyToken(
  token: string,
  expectedType: AuthTokenType,
  opts?: { singleUse?: boolean },
): Promise<VerifyTokenResult> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }));
  } catch {
    throw new TokenError("Token tidak valid atau sudah kedaluwarsa");
  }

  if (payload.tokenType !== expectedType) {
    throw new TokenError("Tipe token tidak sesuai");
  }

  if (opts?.singleUse ?? true) {
    const jti = payload.jti;
    if (!jti) throw new TokenError("Token tidak memiliki jti");
    const row = await db.query.authTokens.findFirst({
      where: eq(authTokens.jti, jti),
    });
    if (!row) throw new TokenError("Token tidak dikenal");
    if (row.usedAt) throw new TokenError("Token sudah digunakan");
    if (row.revokedAt) throw new TokenError("Token telah dicabut");
    if (row.expiresAt.getTime() < Date.now()) {
      throw new TokenError("Token sudah kedaluwarsa");
    }
  }

  return payload as VerifyTokenResult;
}

/** Mark a single-use token consumed (idempotent on already-used). */
export async function consumeToken(jti: string) {
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.jti, jti), isNull(authTokens.usedAt)));
}
