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

/**
 * MyArchitectAI provider (https://www.myarchitectai.com/api).
 * Synchronous: POST { image: <public url>, prompt, outputFormat } with an
 * `x-api-key` header → { output: <CDN url> }. Outputs are deleted within ~5
 * minutes, so we fetch the bytes immediately and hand them back to the caller.
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
      const res = await fetch(`${BASE_URL}${ENDPOINT[input.mode]}`, {
        method: "POST",
        headers: {
          "x-api-key": env.MYARCHITECTAI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: input.imageUrl,
          prompt: input.prompt ?? "",
          outputFormat,
          ...(input.referenceUrl ? { referenceImage: input.referenceUrl } : {}),
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AiProviderError(
          `MyArchitectAI error (${res.status}): ${text.slice(0, 200)}`,
          "PROVIDER_HTTP_ERROR",
        );
      }

      const json = (await res.json()) as { output?: string };
      if (!json.output) {
        throw new AiProviderError(
          "Respons MyArchitectAI tidak berisi output",
          "NO_OUTPUT",
        );
      }

      const imgRes = await fetch(json.output);
      if (!imgRes.ok) {
        throw new AiProviderError(
          "Gagal mengambil hasil render dari CDN",
          "FETCH_OUTPUT_FAILED",
        );
      }
      const contentType =
        imgRes.headers.get("content-type") ??
        (outputFormat === "png" ? "image/png" : "image/jpeg");
      const data = Buffer.from(await imgRes.arrayBuffer());

      return { outputs: [{ data, contentType }], raw: json };
    },
  };
}
