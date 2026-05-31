import type { RenderMode } from "@/db/schema";

export interface AiRenderInput {
  mode: RenderMode;
  /** Public URL of the uploaded original image (real providers fetch it). */
  imageUrl: string;
  /** Raw original bytes — lets the mock provider work without a reachable URL. */
  imageBuffer?: Buffer;
  /** Reference image URL (Style Transfer). */
  referenceUrl?: string;
  prompt?: string;
  outputFormat?: "jpg" | "png";
  options?: Record<string, unknown>;
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

/** Pluggable AI render provider (PRD §6.1). MyArchitectAI is the MVP provider. */
export interface AiProvider {
  readonly name: string;
  createRender(input: AiRenderInput): Promise<AiRenderResult>;
}
