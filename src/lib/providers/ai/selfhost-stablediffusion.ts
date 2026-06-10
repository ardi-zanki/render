import { env } from "@/env";
import { AiProviderError, type AiProvider, type AiRenderOutput } from "./types";

const CONTENT_TYPE_BY_FORMAT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type OutputLike = {
  url?: unknown;
  output?: unknown;
  image?: unknown;
  data?: unknown;
  base64?: unknown;
  contentType?: unknown;
  content_type?: unknown;
  mimeType?: unknown;
  mime_type?: unknown;
};

function filename(contentType: string, fallbackExt: string) {
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : fallbackExt;
  return `image.${ext}`;
}

function blobFrom(data: Buffer, contentType: string) {
  return new Blob([new Uint8Array(data)], { type: contentType });
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timeout) };
}

async function fetchImageUrl(
  url: string,
  fallbackContentType: string,
): Promise<AiRenderOutput> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new AiProviderError(
      `Gagal mengambil hasil Stable Diffusion (${res.status})`,
      "FETCH_OUTPUT_FAILED",
    );
  }

  return {
    data: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? fallbackContentType,
  };
}

function parseDataUrl(value: string, fallbackContentType: string) {
  const match = value.match(/^data:([^;,]+)?;base64,(.+)$/);
  if (!match) return null;
  return {
    data: Buffer.from(match[2], "base64"),
    contentType: match[1] || fallbackContentType,
  };
}

function parseBase64(value: string, contentType: string) {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//.test(trimmed)) return null;
  if (trimmed.length < 100 || trimmed.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) return null;

  try {
    const data = Buffer.from(trimmed, "base64");
    return data.length > 0 ? { data, contentType } : null;
  } catch {
    return null;
  }
}

async function outputFromUnknown(
  value: unknown,
  fallbackContentType: string,
): Promise<AiRenderOutput | null> {
  if (typeof value === "string") {
    if (/^https?:\/\//.test(value)) return fetchImageUrl(value, fallbackContentType);
    return parseDataUrl(value, fallbackContentType) ?? parseBase64(value, fallbackContentType);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const obj = value as OutputLike;
  const contentType =
    typeof obj.contentType === "string"
      ? obj.contentType
      : typeof obj.content_type === "string"
        ? obj.content_type
        : typeof obj.mimeType === "string"
          ? obj.mimeType
          : typeof obj.mime_type === "string"
            ? obj.mime_type
            : fallbackContentType;

  for (const field of [obj.url, obj.output, obj.image, obj.data, obj.base64]) {
    const output = await outputFromUnknown(field, contentType);
    if (output) return output;
  }

  return null;
}

function candidateOutputs(json: JsonValue): unknown[] {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [json];

  const obj = json as Record<string, unknown>;
  for (const key of ["outputs", "output", "images", "image", "results", "result"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (value) return [value];
  }
  return [json];
}

/**
 * Self-hosted Stable Diffusion provider.
 *
 * Expected wrapper contract: POST multipart/form-data to SELFHOST_SD_API_URL.
 * The endpoint may return a raw image, URL(s), data URL(s), or base64 image(s).
 */
export function createSelfHostedStableDiffusionProvider(): AiProvider {
  return {
    name: "selfhost-stablediffusion",
    async createRender(input) {
      if (!env.SELFHOST_SD_API_URL) {
        throw new AiProviderError(
          "SELFHOST_SD_API_URL belum dikonfigurasi",
          "NO_API_URL",
        );
      }

      // No "original" passthrough for this backend; fall back to lossless png.
      const requestedFormat = input.outputFormat ?? "jpg";
      const outputFormat =
        requestedFormat === "original" ? "png" : requestedFormat;
      const fallbackContentType = CONTENT_TYPE_BY_FORMAT[outputFormat];
      const form = new FormData();

      form.set("mode", input.mode);
      form.set("prompt", input.prompt ?? "");
      form.set("output_format", outputFormat);
      form.set("image_url", input.imageUrl);

      if (input.negativePrompt) form.set("negative_prompt", input.negativePrompt);
      if (input.referenceUrl) form.set("reference_url", input.referenceUrl);
      if (typeof input.styleTransferStrength === "number") {
        form.set("style_transfer_strength", String(input.styleTransferStrength));
      }

      if (input.imageBuffer) {
        const contentType = input.imageContentType ?? "image/png";
        form.set("image", blobFrom(input.imageBuffer, contentType), filename(contentType, "png"));
      }

      if (input.referenceBuffer) {
        const contentType = input.referenceContentType ?? "image/png";
        form.set(
          "reference_image",
          blobFrom(input.referenceBuffer, contentType),
          filename(contentType, "png"),
        );
      }

      const timeout = timeoutSignal(env.SELFHOST_SD_TIMEOUT_SECONDS * 1000);
      const res = await fetch(env.SELFHOST_SD_API_URL, {
        method: "POST",
        headers: env.SELFHOST_SD_API_KEY
          ? { Authorization: `Bearer ${env.SELFHOST_SD_API_KEY}` }
          : undefined,
        body: form,
        signal: timeout.signal,
      })
        .catch((err) => {
          if (err instanceof Error && err.name === "AbortError") {
            throw new AiProviderError(
              "Self-hosted Stable Diffusion timeout",
              "PROVIDER_TIMEOUT",
            );
          }
          throw err;
        })
        .finally(timeout.clear);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new AiProviderError(
          `Self-hosted Stable Diffusion error (${res.status}): ${text.slice(0, 200)}`,
          "PROVIDER_HTTP_ERROR",
        );
      }

      const contentType = res.headers.get("content-type") ?? fallbackContentType;
      if (contentType.startsWith("image/")) {
        return {
          outputs: [{ data: Buffer.from(await res.arrayBuffer()), contentType }],
        };
      }

      const json = (await res.json().catch(() => null)) as JsonValue | null;
      if (!json) {
        throw new AiProviderError(
          "Respons self-hosted Stable Diffusion bukan JSON atau image",
          "INVALID_RESPONSE",
        );
      }

      const outputs = (
        await Promise.all(
          candidateOutputs(json).map((item) =>
            outputFromUnknown(item, fallbackContentType),
          ),
        )
      ).filter((item): item is AiRenderOutput => Boolean(item));

      if (outputs.length === 0) {
        throw new AiProviderError(
          "Respons self-hosted Stable Diffusion tidak berisi output",
          "NO_OUTPUT",
        );
      }

      const providerRequestId =
        json && typeof json === "object" && !Array.isArray(json)
          ? typeof json.id === "string"
            ? json.id
            : typeof json.jobId === "string"
              ? json.jobId
              : typeof json.job_id === "string"
                ? json.job_id
                : undefined
          : undefined;

      return { providerRequestId, outputs, raw: json };
    },
  };
}
