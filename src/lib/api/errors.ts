import { NextResponse } from "next/server";

import { InsufficientCreditsError } from "@/lib/credits";
import { AiProviderError } from "@/lib/providers/ai";
import { RateLimitError } from "@/lib/rate-limit";
import { StorageQuotaExceededError } from "@/lib/storage/usage";
import { ImageUploadError } from "@/lib/uploads/images";

/**
 * Maps a known domain error to its JSON `NextResponse`, so every route reports
 * the same status code and payload shape for the same failure. Returns `null`
 * when the error is not one of the recognized domain errors — callers should
 * then fall back to their own 500 response.
 *
 * `aiPrefix` lets the caller phrase the AI-provider failure ("Render gagal" vs
 * "Edit gagal") while keeping the status/code identical.
 */
export function errorResponse(
  err: unknown,
  opts: { aiPrefix?: string } = {},
): NextResponse | null {
  if (err instanceof RateLimitError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: 429 },
    );
  }
  if (err instanceof InsufficientCreditsError) {
    return NextResponse.json(
      { error: err.message, code: "INSUFFICIENT_CREDITS" },
      { status: 402 },
    );
  }
  if (err instanceof AiProviderError) {
    return NextResponse.json(
      { error: `${opts.aiPrefix ?? "Render gagal"}: ${err.message}`, code: err.code },
      { status: 502 },
    );
  }
  if (err instanceof StorageQuotaExceededError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status },
    );
  }
  if (err instanceof ImageUploadError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}
