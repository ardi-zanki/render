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
