import type { RenderMode } from "@/db/schema";

export interface AiRenderInput {
  mode: RenderMode;
  /** Public/temporary URL of the uploaded original image. */
  imageUrl: string;
  /** Reference image (Style Transfer). */
  referenceUrl?: string;
  prompt?: string;
  outputFormat?: string;
  options?: Record<string, unknown>;
}

export interface AiRenderResult {
  providerRequestId?: string;
  status: "succeeded" | "processing" | "failed";
  /** Provider-hosted output image URLs (to be copied into R2). */
  outputUrls: string[];
  raw?: unknown;
}

/** Pluggable AI render provider (PRD §6.1). MyArchitectAI is the MVP provider. */
export interface AiProvider {
  readonly name: string;
  createRender(input: AiRenderInput): Promise<AiRenderResult>;
  /** Poll an async render, if the provider is asynchronous. */
  getRender?(providerRequestId: string): Promise<AiRenderResult>;
}
