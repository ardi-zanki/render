// Single source of truth for image upload limits, shared by the server
// validator (validateImageFile in ./images, backed by sharp) and the client
// pre-flight check (./validate-client, backed by the browser). No Node/sharp
// imports here so it is safe to bundle into client components.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Low floor: the render provider reinterprets the input and pins the output to
// ~2K (see editImageSize in providers/ai/fal.ts), so small design exports and
// photos (e.g. 640x480) are fine. We only reject genuinely tiny thumbnails.
export const MIN_IMAGE_DIMENSION = 256;
export const MAX_IMAGE_DIMENSION = 6000;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const IMAGE_UPLOAD_MESSAGES = {
  required: "Gambar desain wajib diunggah",
  tooLarge:
    "Ukuran gambar maksimal 10 MB. Silakan kompres gambar atau upload versi yang lebih kecil.",
  badType: "Format gambar harus JPG, PNG, atau WebP",
  unreadable: "File gambar tidak dapat dibaca",
  tooSmall: `Resolusi gambar minimal ${MIN_IMAGE_DIMENSION} x ${MIN_IMAGE_DIMENSION} px`,
  tooBig: `Resolusi gambar maksimal ${MAX_IMAGE_DIMENSION} x ${MAX_IMAGE_DIMENSION} px`,
} as const;

/** Type + size check that needs no image decoding. Returns an error message or null. */
export function imageTypeSizeError(file: File): string | null {
  if (file.size <= 0) return IMAGE_UPLOAD_MESSAGES.required;
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_UPLOAD_MESSAGES.tooLarge;
  if (!ALLOWED_IMAGE_TYPES[file.type]) return IMAGE_UPLOAD_MESSAGES.badType;
  return null;
}

/** Dimension check against already-decoded width/height. Returns an error message or null. */
export function imageDimensionError(width: number, height: number): string | null {
  if (!width || !height) return IMAGE_UPLOAD_MESSAGES.unreadable;
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    return IMAGE_UPLOAD_MESSAGES.tooSmall;
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return IMAGE_UPLOAD_MESSAGES.tooBig;
  }
  return null;
}
