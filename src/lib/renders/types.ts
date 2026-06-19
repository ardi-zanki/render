import type {
  RenderAssetType,
  RenderConfig,
  RenderMode,
  RenderOutputFormat,
  RenderStatus,
} from "@/db/schema";
import type { ValidatedImageUpload } from "@/lib/uploads/images";

export const RENDER_COST = 1;
export const LOW_CREDIT_THRESHOLD = 3;

export type UploadedFile = ValidatedImageUpload;

export interface CreateRenderParams {
  userId: string;
  projectId: string;
  mode: RenderMode;
  name?: string;
  prompt: string;
  config?: RenderConfig;
  outputFormat?: RenderOutputFormat;
  negativePrompt?: string;
  styleTransferStrength?: number;
  original: UploadedFile;
  reference?: UploadedFile;
}

export interface CreateRenderResult {
  renderId: string;
  status: "queued";
  originalUrl: string;
  balance: number;
}

export interface RenderAssetView {
  id: string;
  type: RenderAssetType;
  fileUrl: string;
  fileKey: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
  /** For result/edit assets: the settings that produced this version. */
  config: RenderConfig | null;
}

export interface RenderDetail {
  id: string;
  mode: RenderMode;
  name: string | null;
  status: RenderStatus;
  config: RenderConfig | null;
  outputFormat: string;
  creditsUsed: number;
  projectId: string;
  projectName: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  archivedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  resultUrl: string | null;
  originalUrl: string | null;
  referenceUrl: string | null;
  assets: RenderAssetView[];
}

export interface RenderListItem {
  id: string;
  mode: RenderMode;
  name: string | null;
  status: RenderStatus;
  createdAt: Date;
  projectId: string;
  projectName: string | null;
  creditsUsed: number;
  resultUrl: string | null;
  originalUrl: string | null;
}

export type ProviderRequestOptions = {
  negativePrompt?: string;
  styleTransferStrength?: number;
  /** When true, the processor runs the inpaint (region/texture edit) path. */
  inpaint?: boolean;
  /** render_assets.id of the mask to use for the inpaint. */
  maskAssetId?: string;
  /** Composed inpaint prompt (overrides the studio config prompt). */
  texturePrompt?: string;
  /** Human-readable texture name for the "Edit Texture" marker. */
  textureLabel?: string;
};

export function isFinalRenderStatus(status: string) {
  return ["success", "failed", "cancelled", "refunded"].includes(status);
}

export function isRenderableVersion(type: RenderAssetType) {
  return type === "result" || type === "edit";
}

function assetTime(value: Date | string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

export function getLatestRenderableAsset<
  T extends { type: RenderAssetType; createdAt?: Date | string | null },
>(assets: readonly T[]): T | null {
  let latest: T | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const asset of assets) {
    if (!isRenderableVersion(asset.type)) continue;
    const time = assetTime(asset.createdAt);
    if (!latest || time >= latestTime) {
      latest = asset;
      latestTime = time;
    }
  }

  return latest;
}
