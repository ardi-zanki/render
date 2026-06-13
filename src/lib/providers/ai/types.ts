import type { RenderMode, RenderOutputFormat } from "@/db/schema";

export interface AiRenderInput {
  mode: RenderMode;
  /**
   * "render" (default) runs the mode's normal pipeline; "inpaint" replaces only
   * the masked region (region/texture editor) using `maskUrl`/`maskBuffer`.
   */
  operation?: "render" | "inpaint";
  /** Public URL of the uploaded original image (real providers fetch it). */
  imageUrl: string;
  imageContentType?: string;
  /** Raw original bytes — lets the mock provider work without a reachable URL. */
  imageBuffer?: Buffer;
  /** Inpaint mask URL (white = edit, black = keep). Required for `operation:"inpaint"`. */
  maskUrl?: string;
  maskContentType?: string;
  /** Raw mask bytes for providers that cannot reach storage URLs. */
  maskBuffer?: Buffer;
  /** Reference image URL (Style Transfer, or texture reference for inpaint). */
  referenceUrl?: string;
  referenceContentType?: string;
  /** Raw reference bytes for self-hosted providers that cannot reach storage URLs. */
  referenceBuffer?: Buffer;
  prompt?: string;
  outputFormat?: RenderOutputFormat;
  negativePrompt?: string;
  styleTransferStrength?: number;
}

export interface AiRenderOutput {
  data: Buffer;
  contentType: string;
}

export interface AiRenderResult {
  providerRequestId?: string;
  /** Rendered image bytes, already fetched (CDN outputs expire fast). */
  outputs: AiRenderOutput[];
  raw?: unknown;
}

export class AiProviderError extends Error {
  readonly code: string;
  constructor(message: string, code = "AI_PROVIDER_ERROR") {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
  }
}

/** Pluggable AI render provider (PRD §6.1). fal is the MVP provider. */
export interface AiProvider {
  readonly name: string;
  createRender(input: AiRenderInput): Promise<AiRenderResult>;
}
