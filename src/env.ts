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
  APP_URL: z.string().url().default("http://localhost:3210"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET wajib diisi"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3210"),

  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,

  JWT_SECRET: z.string().min(16, "JWT_SECRET wajib diisi"),
  JWT_ISSUER: z.string().default("renderai"),
  JWT_AUDIENCE: z.string().default("renderai-app"),

  RATE_LIMIT_DRIVER: z.literal("database").default("database"),
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
  // Comma-separated origins allowed to read R2 assets cross-origin (canvas
  // pixel reads). Consumed by scripts/setup-r2-cors.ts; falls back to APP_URL.
  R2_CORS_ORIGINS: optional,

  EMAIL_PROVIDER: z.enum(["resend"]).default("resend"),
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default("RenderAI <onboarding@resend.dev>"),

  PAYMENT_PROVIDER: z.enum(["midtrans", "mock"]).default("midtrans"),
  MIDTRANS_SERVER_KEY: optional,
  MIDTRANS_CLIENT_KEY: optional,
  MIDTRANS_IS_PRODUCTION: boolish(false),

  AI_PROVIDER: z.enum(["fal", "mock"]).default("fal"),
  RENDER_PROCESSING_MODE: z.enum(["inline", "worker"]).optional(),
  JOB_LOCK_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(300),
  FAL_KEY: optional,
  FAL_KEY_ID: optional,
  FAL_KEY_SECRET: optional,
  FAL_RENDER_MODEL: z.string().default("fal-ai/flux-2-pro/edit"),
  FAL_STYLE_TRANSFER_MODEL: z.string().default("fal-ai/uso"),
  FAL_UPSCALE_MODEL: z.string().default("fal-ai/aura-sr"),
  // Region/texture editor (inpaint): mask + prompt → masked region replaced.
  FAL_INPAINT_MODEL: z.string().default("fal-ai/flux-pro/v1/fill"),
  FAL_START_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(300),
  // FLUX.2 [pro] edit knobs. Target long edge keeps output ~2K matching the
  // input aspect ratio; safety_tolerance 1 (strict) – 5 (permissive); seed is
  // optional (set it for reproducible renders, leave empty for variety).
  FAL_RENDER_MAX_EDGE: z.coerce.number().int().positive().default(2048),
  FAL_RENDER_SAFETY_TOLERANCE: z
    .enum(["1", "2", "3", "4", "5"])
    .default("2"),
  FAL_RENDER_SEED: z.coerce.number().int().optional(),
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

// A dedicated worker owns the queue by default in production (inline locally).
// Inline can be opted into explicitly in production for single-instance deploys
// that have no separate worker service (e.g. Render Free): the web process then
// renders in-band right after the request commits — identical processing path,
// just no extra service. Fine for low volume; switch to a worker once you scale
// to multiple instances.
const renderProcessingMode =
  parsed.data.RENDER_PROCESSING_MODE ??
  (parsed.data.NODE_ENV === "production" ? "worker" : "inline");

export const env = {
  ...parsed.data,
  RENDER_PROCESSING_MODE: renderProcessingMode,
};
export type Env = typeof env;
