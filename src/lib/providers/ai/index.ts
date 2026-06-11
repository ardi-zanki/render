import { env } from "@/env";
import { createFalAiProvider } from "./fal";
import { createMockAiProvider } from "./mock";
import type { AiProvider } from "./types";

let cached: AiProvider | null = null;

/** The active AI render provider (PRD §6.1). */
export function aiProvider(): AiProvider {
  if (cached) return cached;
  switch (env.AI_PROVIDER) {
    case "mock":
      cached = createMockAiProvider();
      break;
    case "fal":
      cached = createFalAiProvider();
      break;
    default:
      throw new Error(`AI provider tidak didukung: ${env.AI_PROVIDER}`);
  }
  return cached;
}

export {
  AiProviderError,
  type AiProvider,
  type AiRenderInput,
  type AiRenderResult,
} from "./types";
