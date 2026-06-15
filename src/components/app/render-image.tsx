/* eslint-disable @next/next/no-img-element */
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

type RenderImageProps = Omit<ComponentPropsWithoutRef<"img">, "alt" | "src"> & {
  src: string;
  alt: string;
};

/**
 * Plain <img> for dynamic / user-uploaded images (incl. blob: previews and
 * localhost upload URLs) where next/image's domain config and blob handling
 * add friction. Centralized so the lint exception lives in one place.
 */
export const RenderImage = forwardRef<HTMLImageElement, RenderImageProps>(
  function RenderImage({ src, alt, className, loading = "lazy", ...props }, ref) {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={loading}
        className={cn("object-cover", className)}
        {...props}
      />
    );
  },
);
