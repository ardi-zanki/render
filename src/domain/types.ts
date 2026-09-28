/** Shared domain vocabulary. Keep this module independent of runtime and persistence. */
// ── Shared string unions (stored as text, typed in TS) ──────────────
export const RENDER_MODES = ["interior", "exterior", "style_transfer", "upscale"] as const;
export type RenderMode = (typeof RENDER_MODES)[number];
// "original" keeps the provider's native output as-is (no app-side re-encode).
export const RENDER_OUTPUT_FORMATS = ["jpg", "png", "webp", "avif", "original"] as const;
export type RenderOutputFormat = (typeof RENDER_OUTPUT_FORMATS)[number];

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
  /** Marks a version produced by the region/texture editor (vs a normal render). */
  editKind?: "texture";
  /** Human-readable texture name (library item or "uploaded") for the marker. */
  textureLabel?: string;
  /** The composed inpaint prompt for this texture edit. */
  texturePrompt?: string;
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
  | "upscale"
  | "mask";
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
