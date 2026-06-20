// Browser-side pre-flight mirror of validateImageFile (server). Reuses the same
// limits/messages from ./image-constraints so the client rejects bad uploads
// before the request, instead of sending megabytes only to get a 400 back. The
// server validator stays the source of truth — this is a UX shortcut.
import {
  IMAGE_UPLOAD_MESSAGES,
  imageDimensionError,
  imageTypeSizeError,
} from "./image-constraints";

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Returns a localized error message, or null when the file passes all checks. */
export async function validateImageFileClient(file: File): Promise<string | null> {
  const typeSizeError = imageTypeSizeError(file);
  if (typeSizeError) return typeSizeError;

  const dimensions = await readImageDimensions(file);
  if (!dimensions) return IMAGE_UPLOAD_MESSAGES.unreadable;

  return imageDimensionError(dimensions.width, dimensions.height);
}
