import { z } from "zod";

/**
 * Server-side environment validation. Core values are required; external
 * service credentials are optional so the app can boot in local dev — each
 * provider throws a clear error only when it is actually used without config.
 *
 * Do NOT import this from client components.
 */
const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v == null || v === "" ? def : v === "true"));

const optional = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const schema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET wajib diisi"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),

  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  JWT_SECRET: z.string().min(16, "JWT_SECRET wajib diisi"),
  JWT_ISSUER: z.string().default("renderai"),
  JWT_AUDIENCE: z.string().default("renderai-app"),

  RATE_LIMIT_DRIVER: z.enum(["database", "memory"]).default("database"),
  RATE_LIMIT_ENABLED: boolish(true),

  SESSION_DEFAULT_MAX_AGE: z.coerce.number().int().default(604800),
  SESSION_REMEMBER_ME_MAX_AGE: z.coerce.number().int().default(2592000),
  ADMIN_SESSION_MAX_AGE: z.coerce.number().int().default(43200),
  SENSITIVE_ACTION_MAX_AGE: z.coerce.number().int().default(900),

  STORAGE_PROVIDER: z.enum(["r2", "local"]).default("r2"),
  R2_ACCOUNT_ID: optional,
  R2_ACCESS_KEY_ID: optional,
  R2_SECRET_ACCESS_KEY: optional,
  R2_BUCKET_NAME: optional,
  R2_PUBLIC_URL: optional,

  EMAIL_PROVIDER: z.enum(["resend"]).default("resend"),
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("RenderAI <onboarding@resend.dev>"),

  PAYMENT_PROVIDER: z.enum(["midtrans", "doku"]).default("midtrans"),
  MIDTRANS_SERVER_KEY: optional,
  MIDTRANS_CLIENT_KEY: optional,
  MIDTRANS_IS_PRODUCTION: boolish(false),
  DOKU_CLIENT_ID: optional,
  DOKU_SECRET_KEY: optional,
  DOKU_MERCHANT_ID: optional,
  DOKU_ENV: z.enum(["sandbox", "production"]).default("sandbox"),

  AI_PROVIDER: z
    .enum(["myarchitectai", "openai", "mock"])
    .default("myarchitectai"),
  MYARCHITECTAI_API_KEY: optional,
  OPENAI_API_KEY: optional,
  OPENAI_IMAGE_MODEL: optional,
  OPENAI_TEXT_MODEL: optional,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Environment variable tidak valid. Periksa .env.local:\n${issues}`,
  );
}

export const env = parsed.data;
export type Env = typeof env;
