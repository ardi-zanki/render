"use client";

import { Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react";
import { useState } from "react";

import { RenderImage } from "@/components/app/render-image";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.25;

/**
 * Clickable image thumbnail that opens a zoomable lightbox. Zoom grows the
 * image width inside a scrollable area so the user can pan a zoomed image.
 */
export function RenderImagePreview({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const round = (value: number) => Number(value.toFixed(2));
  const zoomIn = () => setZoom((z) => round(Math.min(MAX_ZOOM, z + STEP)));
  const zoomOut = () => setZoom((z) => round(Math.max(MIN_ZOOM, z - STEP)));
  const reset = () => setZoom(1);

  function openLightbox() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openLightbox}
        aria-label={`Perbesar ${alt}`}
        className={cn(
          "group relative block size-full cursor-zoom-in overflow-hidden",
          className,
        )}
      >
        <RenderImage src={src} alt={alt} className="size-full" />
        <span className="pointer-events-none absolute right-2 top-2 flex size-8 items-center justify-center rounded-md bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </span>
      </button>

      {open && (
        <Modal
          onClose={() => setOpen(false)}
          label={alt}
          panelClassName="flex h-[min(90vh,calc(100vh-2rem))] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-dialog"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {alt}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Perkecil"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Perbesar"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={zoom === 1}
                aria-label="Reset zoom"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="ml-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/40 p-4">
            <div className="mx-auto" style={{ width: `${zoom * 100}%` }}>
              <RenderImage
                src={src}
                alt={alt}
                className="block h-auto w-full object-contain"
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
