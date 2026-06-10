import sharp from "sharp";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Low floor: the render provider reinterprets the input and pins the output to
// ~2K (see editImageSize in providers/ai/fal.ts), so small design exports and
// photos (e.g. 640x480) are fine. We only reject genuinely tiny thumbnails.
export const MIN_IMAGE_DIMENSION = 256;
export const MAX_IMAGE_DIMENSION = 6000;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ValidatedImageUpload {
  data: Buffer;
  contentType: string;
  ext: string;
  fileName?: string;
  size: number;
  width: number;
  height: number;
}

export class ImageUploadError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImageUploadError";
    this.status = status;
  }
}

export async function validateImageFile(
  file: File,
): Promise<ValidatedImageUpload> {
  if (file.size <= 0) {
    throw new ImageUploadError("Gambar desain wajib diunggah");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError(
      "Ukuran gambar maksimal 10 MB. Silakan kompres gambar atau upload versi yang lebih kecil.",
    );
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    throw new ImageUploadError("Format gambar harus JPG, PNG, atau WebP");
  }

  const data = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(data).metadata().catch(() => null);
  const width = meta?.width ?? 0;
  const height = meta?.height ?? 0;

  if (!width || !height) {
    throw new ImageUploadError("File gambar tidak dapat dibaca");
  }

  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    throw new ImageUploadError(
      `Resolusi gambar minimal ${MIN_IMAGE_DIMENSION} x ${MIN_IMAGE_DIMENSION} px`,
    );
  }

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new ImageUploadError(
      `Resolusi gambar maksimal ${MAX_IMAGE_DIMENSION} x ${MAX_IMAGE_DIMENSION} px`,
    );
  }

  return {
    data,
    contentType: file.type,
    ext,
    fileName: file.name,
    size: file.size,
    width,
    height,
  };
}
