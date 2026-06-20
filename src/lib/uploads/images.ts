import sharp from "sharp";

import {
  ALLOWED_IMAGE_TYPES,
  imageDimensionError,
  imageTypeSizeError,
} from "./image-constraints";

export {
  MAX_IMAGE_BYTES,
  MIN_IMAGE_DIMENSION,
  MAX_IMAGE_DIMENSION,
} from "./image-constraints";

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
  const typeSizeError = imageTypeSizeError(file);
  if (typeSizeError) {
    throw new ImageUploadError(typeSizeError);
  }

  const ext = ALLOWED_IMAGE_TYPES[file.type];
  const data = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(data).metadata().catch(() => null);
  const width = meta?.width ?? 0;
  const height = meta?.height ?? 0;

  const dimensionError = imageDimensionError(width, height);
  if (dimensionError) {
    throw new ImageUploadError(dimensionError);
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
