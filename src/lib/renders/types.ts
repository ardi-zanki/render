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
  /** For result/edit assets: the settings + prompt that produced this version. */
  config: RenderConfig | null;
  prompt: string | null;
}

export interface RenderDetail {
  id: string;
  mode: RenderMode;
  name: string | null;
  status: RenderStatus;
  prompt: string | null;
  config: RenderConfig | null;
  outputFormat: string;
  creditsUsed: number;
  projectId: string;
  projectName: string;
  createdAt: Date;
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
  prompt: string | null;
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
