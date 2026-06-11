import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ── Shared string unions (stored as text, typed in TS) ──────────────
export type RenderMode = "interior" | "exterior" | "style_transfer" | "upscale";
// "original" keeps the provider's native output as-is (no app-side re-encode).
export type RenderOutputFormat = "jpg" | "png" | "webp" | "avif" | "original";

/**
 * Raw Render Studio selections, persisted so a render can be reopened in the
 * studio with every control pre-filled (the composed `prompt` is not reversible
 * and is treated as a secret, so we store the inputs instead).
 */
export type RenderConfig = {
  style?: string;
  time?: string;
  weather?: string;
  lightsOn?: boolean;
  location?: string;
  surrounding?: string;
  instruction?: string;
};
export type RenderStatus =
  | "queued"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded";
export type JobStatus = "queued" | "processing" | "success" | "failed";
export type RenderAssetType =
  | "original"
  | "reference"
  | "result"
  | "edit"
  | "upscale";
export type CreditTxType =
  | "purchase"
  | "usage"
  | "refund"
  | "bonus"
  | "adjustment";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";
export type NotificationType =
  | "render_success"
  | "render_failed"
  | "payment_success"
  | "payment_failed"
  | "low_credit"
  | "email_verification"
  | "system";
export type AuthTokenType =
  | "email_verification"
  | "password_reset"
  | "signed_download"
  | "temporary_upload"
  | "api_access";

// ── user_profiles ───────────────────────────────────────────────────
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  defaultRenderMode: text("default_render_mode")
    .$type<RenderMode>()
    .default("interior"),
  defaultOutputFormat: text("default_output_format").default("png"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── projects ────────────────────────────────────────────────────────
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("projects_user_id_idx").on(t.userId)],
);

// ── renders ─────────────────────────────────────────────────────────
export const renders = pgTable(
  "renders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mode: text("mode").$type<RenderMode>().notNull(),
    prompt: text("prompt"),
    enhancedPrompt: text("enhanced_prompt"),
    // Raw studio selections used to build the prompt (for re-open / re-render).
    config: jsonb("config").$type<RenderConfig>(),
    outputFormat: text("output_format").notNull().default("png"),
    status: text("status").$type<RenderStatus>().notNull().default("queued"),
    creditsUsed: integer("credits_used").notNull().default(0),
    aiProvider: text("ai_provider"),
    providerRequestId: text("provider_request_id"),
    providerResponse: jsonb("provider_response"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    // Public share: when set, the render result is viewable at /s/<slug>.
    shareSlug: text("share_slug").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: text("deleted_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("renders_user_id_idx").on(t.userId),
    index("renders_project_id_idx").on(t.projectId),
    index("renders_status_idx").on(t.status),
  ],
);

// ── render_assets ───────────────────────────────────────────────────
export const renderAssets = pgTable(
  "render_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    renderId: uuid("render_id")
      .notNull()
      .references(() => renders.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    type: text("type").$type<RenderAssetType>().notNull(),
    fileUrl: text("file_url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name"),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    width: integer("width"),
    height: integer("height"),
    // For result/edit assets: the studio selections + composed prompt that
    // produced this version, so each version can be reopened/continued.
    config: jsonb("config").$type<RenderConfig>(),
    prompt: text("prompt"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("render_assets_render_id_idx").on(t.renderId)],
);

// ── render_jobs ─────────────────────────────────────────────────────
export const renderJobs = pgTable(
  "render_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    renderId: uuid("render_id")
      .notNull()
      .references(() => renders.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").$type<JobStatus>().notNull().default("queued"),
    // Set for edit/re-render jobs (a new version on the same render). Used as
    // the per-generation key for credit charge/refund. Null = initial render.
    editId: text("edit_id"),
    // The render_assets.id used as the base image for an iterative edit. Null
    // falls back to the original. Lets edits build on a selected prior version.
    baseAssetId: uuid("base_asset_id"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("render_jobs_status_available_idx").on(t.status, t.availableAt),
  ],
);

// ── credit_balances ─────────────────────────────────────────────────
export const creditBalances = pgTable("credit_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── credit_transactions ─────────────────────────────────────────────
export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<CreditTxType>().notNull(),
    amount: integer("amount").notNull(),
    balanceBefore: integer("balance_before").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    description: text("description"),
    renderId: uuid("render_id").references(() => renders.id, {
      onDelete: "set null",
    }),
    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),
    // idempotency key for usage/refund/purchase so the same event can't be
    // applied twice (PRD §22.3 — credit usage must be idempotent).
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("credit_tx_user_id_idx").on(t.userId),
    uniqueIndex("credit_tx_idempotency_key_uq").on(t.idempotencyKey),
  ],
);

// ── payment_packages ────────────────────────────────────────────────
export const paymentPackages = pgTable("payment_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("IDR"),
  credits: integer("credits").notNull(),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── payments ────────────────────────────────────────────────────────
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => paymentPackages.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id").notNull().unique(),
    providerTransactionId: text("provider_transaction_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("IDR"),
    creditsAdded: integer("credits_added").notNull().default(0),
    status: text("status").$type<PaymentStatus>().notNull().default("pending"),
    paymentUrl: text("payment_url"),
    snapToken: text("snap_token"),
    paymentType: text("payment_type"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    rawResponse: jsonb("raw_response"),
    rawWebhook: jsonb("raw_webhook"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("payments_user_id_idx").on(t.userId)],
);

// ── notifications ───────────────────────────────────────────────────
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    message: text("message"),
    actionUrl: text("action_url"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("notifications_user_id_read_idx").on(t.userId, t.isRead)],
);

// ── email_logs ──────────────────────────────────────────────────────
export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  toEmail: text("to_email").notNull(),
  subject: text("subject"),
  provider: text("provider"),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull().default("sent"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── auth_tokens (single-use JWT tracking) ───────────────────────────
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<AuthTokenType>().notNull(),
    jti: text("jti").notNull().unique(),
    tokenHash: text("token_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("auth_tokens_user_id_idx").on(t.userId)],
);

// ── rate_limits ─────────────────────────────────────────────────────
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    scope: text("scope").notNull(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true })
      .notNull()
      .defaultNow(),
    windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("rate_limits_key_uq").on(t.key)],
);

// ── admin_audit_logs ────────────────────────────────────────────────
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminUserId: text("admin_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
