import type { RenderMode } from "@/db/schema";
import { env } from "@/env";
import { AiProviderError, type AiProvider } from "./types";

const BASE_URL = "https://api.myarchitectai.com/v1";

/** Map our render modes to MyArchitectAI endpoints. */
const ENDPOINT: Record<RenderMode, string> = {
  interior: "/render/interior",
  exterior: "/render/exterior",
  style_transfer: "/style-transfer",
  upscale: "/upscale-4k",
};

const CONTENT_TYPE_BY_FORMAT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

type MyArchitectAiResponse = {
  output?: string[] | string;
  balance?: number;
  cost?: number;
  error?: string;
  message?: string;
};

async function readJson(res: Response): Promise<MyArchitectAiResponse | null> {
  return (await res.json().catch(() => null)) as MyArchitectAiResponse | null;
}

function outputUrls(output: MyArchitectAiResponse["output"]) {
  if (Array.isArray(output)) return output.filter((url) => typeof url === "string");
  if (typeof output === "string") return [output];
  return [];
}

/**
 * MyArchitectAI provider (https://www.myarchitectai.com/api).
 * Synchronous: POST JSON with an `x-api-key` header. The API returns a list of
 * temporary CDN URLs, so we fetch all bytes immediately before they expire.
 */
export function createMyArchitectAiProvider(): AiProvider {
  return {
    name: "myarchitectai",
    async createRender(input) {
      if (!env.MYARCHITECTAI_API_KEY) {
        throw new AiProviderError(
          "MYARCHITECTAI_API_KEY belum dikonfigurasi",
          "NO_API_KEY",
        );
      }

      const outputFormat = input.outputFormat ?? "jpg";
      const body: Record<string, unknown> = {
        image: input.imageUrl,
        outputFormat,
      };

      if (input.prompt) body.prompt = input.prompt;
      if (input.referenceUrl) body.referenceImage = input.referenceUrl;
      if (input.negativePrompt) body.negativePrompt = input.negativePrompt;
      if (typeof input.styleTransferStrength === "number") {
        body.styleTransferStrength = input.styleTransferStrength;
      }

      const res = await fetch(`${BASE_URL}${ENDPOINT[input.mode]}`, {
        method: "POST",
        headers: {
          "x-api-key": env.MYARCHITECTAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const json = text
          ? (() => {
              try {
                return JSON.parse(text) as MyArchitectAiResponse;
              } catch {
                return null;
              }
            })()
          : null;
        const message = json?.error ?? json?.message ?? text;
        throw new AiProviderError(
          `MyArchitectAI error (${res.status}): ${message.slice(0, 200)}`,
          "PROVIDER_HTTP_ERROR",
        );
      }

      const json = await readJson(res);
      const urls = outputUrls(json?.output);
      if (urls.length === 0) {
        throw new AiProviderError(
          "Respons MyArchitectAI tidak berisi output",
          "NO_OUTPUT",
        );
      }

      const outputs = await Promise.all(
        urls.map(async (url) => {
          const imgRes = await fetch(url);
          if (!imgRes.ok) {
            throw new AiProviderError(
              "Gagal mengambil hasil render dari CDN",
              "FETCH_OUTPUT_FAILED",
            );
          }

          return {
            data: Buffer.from(await imgRes.arrayBuffer()),
            contentType:
              imgRes.headers.get("content-type") ??
              CONTENT_TYPE_BY_FORMAT[outputFormat],
          };
        }),
      );

      return { outputs, raw: json };
    },
  };
}
