"use client";

import {
  ArrowLeftRight,
  ImagePlus,
  Loader2,
  PanelLeft,
  Pencil,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode } from "@/db/schema";
import { cn } from "@/lib/utils";
import type { StudioView, ViewerTab } from "./types";

export function RenderPreviewViewer({
  fileRef,
  referenceRef,
  allowRemoveImage = true,
  hasUploadedImage,
  viewerTabs,
  view,
  setView,
  shownImage,
  previewUrl,
  resultUrl,
  canCompare,
  comparisonPosition,
  setComparisonPosition,
  zoom,
  zoomOut,
  zoomIn,
  resetZoom,
  isProcessing,
  renderStatus,
  file,
  pickFile,
  mode,
  referencePreviewUrl,
  pickReference,
  styleTransferStrength,
  setStyleTransferStrength,
  negativePrompt,
  setNegativePrompt,
  error,
  editAvailable = false,
  studioMode = "render",
  setStudioMode,
  panelsCollapsed = false,
  onExpandPanels,
  textureCanvas,
  textureToolbar,
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  referenceRef: RefObject<HTMLInputElement | null>;
  /** When false, the canvas hides the remove-image (X) control. */
  allowRemoveImage?: boolean;
  hasUploadedImage: boolean;
  viewerTabs: ViewerTab[];
  view: StudioView;
  setView: (view: StudioView) => void;
  shownImage: string | null;
  previewUrl: string | null;
  resultUrl: string | null;
  canCompare: boolean;
  comparisonPosition: number;
  setComparisonPosition: (position: number) => void;
  zoom: number;
  zoomOut: () => void;
  zoomIn: () => void;
  resetZoom: () => void;
  isProcessing: boolean;
  renderStatus: string | null;
  file: File | null;
  pickFile: (file: File | null) => void;
  mode: RenderMode;
  referencePreviewUrl: string | null;
  pickReference: (file: File | null) => void;
  styleTransferStrength: number;
  setStyleTransferStrength: (value: number) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  error: string;
  /** Show the "Edit" (texture) toggle — only for a completed render w/ result. */
  editAvailable?: boolean;
  studioMode?: "render" | "texture";
  setStudioMode?: (mode: "render" | "texture") => void;
  /** When both side panels are collapsed, show the reopen control by the tabs. */
  panelsCollapsed?: boolean;
  onExpandPanels?: () => void;
  /** Texture-edit canvas + toolbar, rendered by the studio (owns the ref). */
  textureCanvas?: ReactNode;
  textureToolbar?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden lg:h-full">
      <CardContent className="flex flex-col gap-4 py-4 lg:h-full lg:min-h-0">
        {/* Sticky toolbar: view tabs (+ Edit) + zoom controls. */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {panelsCollapsed && onExpandPanels && (
              // Reopen control, grouped with the view tabs (desktop only).
              <div className="hidden items-center rounded-md bg-muted/80 p-1 lg:inline-flex">
                <button
                  type="button"
                  onClick={onExpandPanels}
                  aria-label="Buka panel"
                  title="Buka panel"
                  className="flex items-center rounded-sm px-2.5 py-1 text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4"
                >
                  <PanelLeft />
                </button>
              </div>
            )}
            {hasUploadedImage ? (
              <Segmented
                options={viewerTabs}
                value={view}
                onChange={(value) => {
                  setStudioMode?.("render");
                  setView(value);
                }}
                size="sm"
              />
            ) : (
              <div />
            )}
            {editAvailable && (
              // Matches the sm Segmented above: muted track + py-1 text-xs pill.
              <div className="inline-flex items-center rounded-md bg-muted/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setView("result");
                    setStudioMode?.("texture");
                  }}
                  aria-pressed={studioMode === "texture"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-colors [&_svg]:size-3.5",
                    studioMode === "texture"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Pencil /> Edit
                </button>
              </div>
            )}
          </div>

          {(studioMode === "texture" ? Boolean(textureCanvas) : shownImage) && (
            <div className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-md bg-muted/80 p-1 sm:h-9">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
                className="size-6 sm:size-7"
              >
                <ZoomOut />
              </Button>
              <button
                type="button"
                onClick={resetZoom}
                className="h-6 min-w-10 rounded-md px-1.5 text-xs font-semibold text-foreground hover:bg-card sm:h-7 sm:min-w-11"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                disabled={zoom >= 3}
                aria-label="Zoom in"
                title="Zoom in"
                className="size-6 sm:size-7"
              >
                <ZoomIn />
              </Button>
            </div>
          )}
        </div>

        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/35 lg:aspect-auto lg:min-h-0 lg:flex-1">
          {studioMode === "texture" ? (
            textureCanvas ?? (
              <p className="px-4 text-center text-sm text-muted-foreground">
                Tidak ada gambar hasil untuk diedit.
              </p>
            )
          ) : canCompare && view === "comparison" ? (
            // Match the same stage sizing used by Asli/Hasil/Edit, so 100%
            // zoom does not jump between tabs.
            <div className="flex size-full items-center justify-center overflow-hidden">
              <div
                className="relative size-full overflow-hidden"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                {/* Base = original (right side); defines the box. */}
                <RenderImage
                  src={previewUrl ?? ""}
                  alt="Gambar asli"
                  className="block size-full select-none object-contain"
                />
                {/* Overlay = result, revealed on the left as the handle moves. */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)` }}
                >
                  <RenderImage
                    src={resultUrl ?? ""}
                    alt="Hasil render"
                    className="absolute inset-0 size-full object-contain"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(15_23_42/0.12)]"
                  style={{ left: `${comparisonPosition}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={comparisonPosition}
                  onChange={(event) =>
                    setComparisonPosition(Number(event.target.value))
                  }
                  className="absolute inset-0 size-full cursor-ew-resize opacity-0"
                  aria-label="Geser komparasi"
                />
                {/* Handle — centered exactly on the divider line. */}
                <span
                  className="pointer-events-none absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-floating"
                  style={{ left: `${comparisonPosition}%` }}
                >
                  <ArrowLeftRight className="size-4" />
                </span>
                {/* Labels — symmetric on each side of the handle. */}
                <span
                  className="pointer-events-none absolute top-1/2 -translate-x-full -translate-y-1/2 rounded-full border border-border bg-background/95 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-floating"
                  style={{ left: `calc(${comparisonPosition}% - 1.5rem)` }}
                >
                  Hasil
                </span>
                <span
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/95 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-floating"
                  style={{ left: `calc(${comparisonPosition}% + 1.5rem)` }}
                >
                  Asli
                </span>
              </div>
            </div>
          ) : shownImage ? (
            <div className="flex size-full items-center justify-center overflow-hidden">
              <RenderImage
                src={shownImage}
                alt={view === "result" ? "Hasil render" : "Gambar asli"}
                className="size-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <div className="flex size-10 items-center justify-center rounded-md bg-secondary">
                <ImagePlus className="size-5" />
              </div>
              <span className="text-sm font-medium">
                Klik untuk mengunggah gambar desain
              </span>
              <span className="text-xs">JPG, PNG, atau WebP · maks 10MB</span>
            </button>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {renderStatus === "queued"
                  ? "Render masuk antrean..."
                  : "Memproses render..."}
              </p>
            </div>
          )}

          {allowRemoveImage && file && !isProcessing && (
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-background/85 text-foreground shadow-floating hover:bg-background"
              aria-label="Hapus gambar"
            >
              <X className="size-4" />
            </button>
          )}

          {studioMode === "texture" && textureToolbar && (
            <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center sm:inset-x-3 sm:bottom-3">
              <div className="pointer-events-auto">{textureToolbar}</div>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        {mode === "style_transfer" && (
          <div className="rounded-lg border border-border/80 bg-muted/35 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <Label>Reference Image</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Wajib untuk Style Transfer.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => referenceRef.current?.click()}
                disabled={isProcessing}
              >
                <ImagePlus /> Pilih
              </Button>
            </div>
            {referencePreviewUrl ? (
              <div className="relative overflow-hidden rounded-md border border-border bg-muted">
                <RenderImage
                  src={referencePreviewUrl}
                  alt="Reference"
                  className="aspect-video size-full"
                />
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => pickReference(null)}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-background/85 text-foreground shadow-floating"
                    aria-label="Hapus reference"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => referenceRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground"
              >
                <ImagePlus className="size-4" />
                Unggah gambar referensi
              </button>
            )}
            <input
              ref={referenceRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickReference(e.target.files?.[0] ?? null)}
            />
            <div className="mt-3 grid gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="styleTransferStrength">Kekuatan style</Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round(styleTransferStrength * 100)}%
                  </span>
                </div>
                <Input
                  id="styleTransferStrength"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={styleTransferStrength}
                  onChange={(e) =>
                    setStyleTransferStrength(Number(e.target.value))
                  }
                  disabled={isProcessing}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="negativePrompt">Negative prompt</Label>
                <Textarea
                  id="negativePrompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Elemen yang ingin dihindari: blur, furniture berlebihan, warna terlalu gelap..."
                  maxLength={1000}
                  className="min-h-16"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
