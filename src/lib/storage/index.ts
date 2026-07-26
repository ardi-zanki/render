import { env } from "@/env";
import type { RenderAssetType } from "@/db/schema";
import { createLocalProvider } from "./local";
import { createR2Provider } from "./r2";
import type { StorageProvider } from "./types";

let cached: StorageProvider | null = null;

/** The active storage provider (PRD §6.1 provider layer). */
export function storage(): StorageProvider {
  if (cached) return cached;
  switch (env.STORAGE_PROVIDER) {
    case "r2":
      cached = createR2Provider();
      break;
    case "local":
      cached = createLocalProvider();
      break;
    default:
      throw new Error(`Storage provider tidak didukung: ${env.STORAGE_PROVIDER}`);
  }
  return cached;
}

/**
 * URL exposed to the browser for a stored asset.
 *
 * Local asset records may have been created while the app was running on a
 * different port (for example by Playwright). A root-relative URL keeps those
 * records usable from whichever local origin is currently serving the app.
 * R2 objects are private and exposed through short-lived signed URLs. The
 * persisted fileUrl is intentionally ignored for R2 so legacy public URLs are
 * not leaked back to the browser.
 */
export async function browserAssetUrl(
  _fileUrl: string,
  fileKey: string,
  provider: "local" | "r2" = env.STORAGE_PROVIDER,
): Promise<string> {
  if (provider === "local") {
    return `/uploads/${fileKey
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }
  return storage().getSignedDownloadUrl(fileKey, 3600);
}

const PRIVATE_ASSET_PREFIX = "storage:";

/** Stable database reference for a private object (never sent to a browser). */
export function privateAssetReference(fileKey: string): string {
  return `${PRIVATE_ASSET_PREFIX}${fileKey}`;
}

/** Resolve a private avatar reference while preserving external OAuth images. */
export async function browserUserImageUrl(
  image: string | null | undefined,
): Promise<string | null> {
  if (!image) return null;
  if (image.startsWith(PRIVATE_ASSET_PREFIX)) {
    return browserAssetUrl("", image.slice(PRIVATE_ASSET_PREFIX.length));
  }

  // Backward compatibility for avatars stored before R2 became private.
  const legacyBase = env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (env.STORAGE_PROVIDER === "r2" && legacyBase && image.startsWith(`${legacyBase}/`)) {
    return browserAssetUrl(image, image.slice(legacyBase.length + 1));
  }
  return image;
}

export interface RenderAssetKeyParams {
  userId: string;
  projectId: string;
  renderId: string;
  type: RenderAssetType;
  ext: string;
  /** 1-based index for result/edit/upscale assets. */
  index?: number;
}

/**
 * Build the canonical R2 object key for a render asset (PRD §17.2):
 *   users/{userId}/projects/{projectId}/renders/{renderId}/<name>.{ext}
 */
export function renderAssetKey(p: RenderAssetKeyParams): string {
  const base = `users/${p.userId}/projects/${p.projectId}/renders/${p.renderId}`;
  const i = p.index ?? 1;
  switch (p.type) {
    case "original":
      return `${base}/original.${p.ext}`;
    case "reference":
      return `${base}/reference.${p.ext}`;
    case "result":
      return `${base}/result-${i}.${p.ext}`;
    case "edit":
      return `${base}/edit-${i}.${p.ext}`;
    case "upscale":
      return `${base}/upscale-${i}.${p.ext}`;
    case "mask":
      return `${base}/mask-${i}.${p.ext}`;
  }
}

export type { StorageProvider } from "./types";
