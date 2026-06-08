import { ApiError, createFalClient } from "@fal-ai/client";
import sharp from "sharp";

import { env } from "@/env";
import { AiProviderError, type AiProvider, type AiRenderOutput } from "./types";

const CONTENT_TYPE_BY_FORMAT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
} as const;

type OutputFormat = keyof typeof CONTENT_TYPE_BY_FORMAT;

type JsonObject = Record<string, unknown>;

type FileLike = {
  url?: unknown;
  image_url?: unknown;
  content_type?: unknown;
  mime_type?: unknown;
  contentType?: unknown;
  mimeType?: unknown;
};

function falCredentials() {
  if (env.FAL_KEY) return env.FAL_KEY;
  if (env.FAL_KEY_ID && env.FAL_KEY_SECRET) {
    return `${env.FAL_KEY_ID}:${env.FAL_KEY_SECRET}`;
  }
  return undefined;
}

function falOutputFormat(format: OutputFormat) {
  return format === "png" ? "png" : "jpeg";
}

function blobFrom(data: Buffer, contentType: string) {
  return new Blob([new Uint8Array(data)], { type: contentType });
}

async function uploadImage(params: {
  client: ReturnType<typeof createFalClient>;
  url: string;
  data?: Buffer;
  contentType?: string;
}) {
  if (!params.data) return params.url;

  return params.client.storage.upload(blobFrom(params.data, params.contentType ?? "image/png"), {
    lifecycle: { expiresIn: "1h" },
  });
}

function contentTypeOf(value: FileLike, fallback: string) {
  return typeof value.content_type === "string"
    ? value.content_type
    : typeof value.mime_type === "string"
      ? value.mime_type
      : typeof value.contentType === "string"
        ? value.contentType
        : typeof value.mimeType === "string"
          ? value.mimeType
          : fallback;
}

function parseDataUrl(value: string, fallbackContentType: string) {
  const match = value.match(/^data:([^;,]+)?;base64,(.+)$/);
  if (!match) return null;
  return {
    data: Buffer.from(match[2], "base64"),
    contentType: match[1] || fallbackContentType,
  };
}

async function fetchImageUrl(
  url: string,
  fallbackContentType: string,
): Promise<AiRenderOutput> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new AiProviderError(
      `Gagal mengambil hasil fal.ai (${res.status})`,
      "FETCH_OUTPUT_FAILED",
    );
  }

  return {
    data: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") ?? fallbackContentType,
  };
}

async function outputFromUnknown(
  value: unknown,
  fallbackContentType: string,
): Promise<AiRenderOutput | null> {
  if (typeof value === "string") {
    if (/^https?:\/\//.test(value)) return fetchImageUrl(value, fallbackContentType);
    return parseDataUrl(value, fallbackContentType);
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const file = value as FileLike;
  const contentType = contentTypeOf(file, fallbackContentType);
  for (const field of [file.url, file.image_url]) {
    const output = await outputFromUnknown(field, contentType);
    if (output) return output;
  }

  return null;
}

function candidateOutputs(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [data];

  const obj = data as JsonObject;
  for (const key of ["images", "image", "output", "outputs", "result", "results"]) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
    if (value) return [value];
  }
  return [data];
}

async function normalizeOutput(
  output: AiRenderOutput,
  outputFormat: OutputFormat,
): Promise<AiRenderOutput> {
  const contentType = CONTENT_TYPE_BY_FORMAT[outputFormat];
  if (output.contentType === contentType) return output;

  const image = sharp(output.data);
  const data =
    outputFormat === "png"
      ? await image.png().toBuffer()
      : outputFormat === "webp"
        ? await image.webp({ quality: 88 }).toBuffer()
        : outputFormat === "avif"
          ? await image.avif({ quality: 60 }).toBuffer()
          : await image.jpeg({ quality: 90 }).toBuffer();

  return { data, contentType };
}

function baseEditPrompt(prompt: string | undefined, mode: string) {
  const trimmed = prompt?.trim();
  if (trimmed) return trimmed;
  if (mode === "interior") {
    return "Create a polished architectural interior render while preserving the room layout.";
  }
  return "Create a polished architectural exterior render while preserving the building structure.";
}

function apiErrorDetail(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  for (const key of ["detail", "error", "message"]) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  if (Array.isArray(obj.detail)) {
    const detail = obj.detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item
          ? String((item as { msg: unknown }).msg)
          : String(item),
      )
      .filter(Boolean)
      .join("; ");
    return detail || null;
  }
  return null;
}

function providerError(err: unknown) {
  if (err instanceof AiProviderError) return err;
  if (err instanceof ApiError) {
    const detail = apiErrorDetail(err.body);
    const message = detail ? `${err.message}: ${detail}` : err.message;
    return new AiProviderError(
      `fal.ai error (${err.status}): ${message.slice(0, 300)}`,
      err.isUserTimeout ? "PROVIDER_TIMEOUT" : "PROVIDER_HTTP_ERROR",
    );
  }
  if (err instanceof Error) {
    return new AiProviderError(`fal.ai error: ${err.message}`, "AI_PROVIDER_ERROR");
  }
  return new AiProviderError(`fal.ai error: ${String(err)}`, "AI_PROVIDER_ERROR");
}

export function createFalAiProvider(): AiProvider {
  return {
    name: "fal",
    async createRender(input) {
      const credentials = falCredentials();
      if (!credentials) {
        throw new AiProviderError("FAL_KEY belum dikonfigurasi", "NO_API_KEY");
      }

      const outputFormat = input.outputFormat ?? "jpg";
      const fallbackContentType = CONTENT_TYPE_BY_FORMAT[outputFormat];
      const modelOutputFormat = falOutputFormat(outputFormat);
      const client = createFalClient({ credentials });

      try {
        const imageUrl = await uploadImage({
          client,
          url: input.imageUrl,
          data: input.imageBuffer,
          contentType: input.imageContentType,
        });
        const referenceUrl = input.referenceUrl
          ? await uploadImage({
              client,
              url: input.referenceUrl,
              data: input.referenceBuffer,
              contentType: input.referenceContentType,
            })
          : undefined;

        const endpointId =
          input.mode === "upscale"
            ? env.FAL_UPSCALE_MODEL
            : input.mode === "style_transfer"
              ? env.FAL_STYLE_TRANSFER_MODEL
              : env.FAL_RENDER_MODEL;

        let requestInput: JsonObject;
        if (input.mode === "upscale") {
          requestInput = {
            image_url: imageUrl,
            upscale_factor: 4,
            overlapping_tiles: true,
            checkpoint: "v2",
          };
        } else if (input.mode === "style_transfer") {
          if (!referenceUrl) {
            throw new AiProviderError(
              "Reference image wajib tersedia untuk fal style transfer",
              "MISSING_REFERENCE_IMAGE",
            );
          }
          requestInput = {
            prompt: input.prompt ?? "",
            input_image_urls: [imageUrl, referenceUrl],
            keep_size: true,
            num_images: 1,
            enable_safety_checker: true,
            output_format: modelOutputFormat,
          };
          if (input.negativePrompt) requestInput.negative_prompt = input.negativePrompt;
          if (typeof input.styleTransferStrength === "number") {
            requestInput.guidance_scale = 2 + input.styleTransferStrength * 4;
          }
        } else {
          requestInput = {
            prompt: baseEditPrompt(input.prompt, input.mode),
            image_url: imageUrl,
            num_images: 1,
            enable_safety_checker: true,
            output_format: modelOutputFormat,
            resolution_mode: "match_input",
          };
        }

        const result = await client.subscribe(endpointId, {
          input: requestInput,
          logs: false,
          startTimeout: env.FAL_START_TIMEOUT_SECONDS,
          storageSettings: { expiresIn: "1h" },
        });

        const outputs = (
          await Promise.all(
            candidateOutputs(result.data).map((item) =>
              outputFromUnknown(item, fallbackContentType),
            ),
          )
        ).filter((item): item is AiRenderOutput => Boolean(item));

        if (outputs.length === 0) {
          throw new AiProviderError(
            "Respons fal.ai tidak berisi output image",
            "NO_OUTPUT",
          );
        }

        return {
          providerRequestId: result.requestId,
          outputs: await Promise.all(
            outputs.map((output) => normalizeOutput(output, outputFormat)),
          ),
          raw: {
            endpointId,
            response: result.data,
          },
        };
      } catch (err) {
        throw providerError(err);
      }
    },
  };
}
