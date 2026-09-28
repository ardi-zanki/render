/** Domain failures shared by services and transport adapters; no infrastructure imports. */

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Credit Anda tidak cukup untuk membuat render");
    this.name = "InsufficientCreditsError";
  }
}

export class RateLimitError extends Error {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly resetAt: Date;
  constructor(resetAt: Date) {
    super("Terlalu banyak percobaan. Silakan coba lagi beberapa saat.");
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

export class StorageQuotaExceededError extends Error {
  readonly code = "STORAGE_QUOTA_EXCEEDED";
  readonly status = 413;

  constructor() {
    super("Penyimpanan kamu sudah mencapai batas 1 GB. Hapus file lama dulu.");
    this.name = "StorageQuotaExceededError";
  }
}

export class ImageUploadError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImageUploadError";
    this.status = status;
  }
}

export class AiProviderError extends Error {
  readonly code: string;
  constructor(message: string, code = "AI_PROVIDER_ERROR") {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}
