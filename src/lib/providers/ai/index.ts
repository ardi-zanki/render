import { env } from "@/env";
import { createMockAiProvider } from "./mock";
import { createMyArchitectAiProvider } from "./myarchitectai";
import { createSelfHostedStableDiffusionProvider } from "./selfhost-stablediffusion";
import type { AiProvider } from "./types";

let cached: AiProvider | null = null;

/** The active AI render provider (PRD §6.1). */
export function aiProvider(): AiProvider {
  if (cached) return cached;
  switch (env.AI_PROVIDER) {
    case "myarchitectai":
      cached = createMyArchitectAiProvider();
      break;
    case "mock":
      cached = createMockAiProvider();
      break;
    case "selfhost-stablediffusion":
      cached = createSelfHostedStableDiffusionProvider();
      break;
    case "openai":
      throw new Error("OpenAI image provider belum diimplementasi (Phase 7).");
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
