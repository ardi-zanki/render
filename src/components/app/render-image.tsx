/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Plain <img> for dynamic / user-uploaded images (incl. blob: previews and
 * localhost upload URLs) where next/image's domain config and blob handling
 * add friction. Centralized so the lint exception lives in one place.
 */
export function RenderImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("object-cover", className)}
      style={style}
    />
  );
}
