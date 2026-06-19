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
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode } from "@/db/schema";
import { cn } from "@/lib/utils";
import type { StudioView, ViewerTab } from "./types";

const clampComparisonPosition = (position: number) =>
  Math.min(100, Math.max(0, position));

type ComparisonBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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
  setZoom,
  zoomOut,
  zoomIn,
  resetZoom,
  isProcessing,
  renderStatus,
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
  setZoom: (next: number | ((value: number) => number)) => void;
  zoomOut: () => void;
  zoomIn: () => void;
  resetZoom: () => void;
  isProcessing: boolean;
  renderStatus: string | null;
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const comparisonStageRef = useRef<HTMLDivElement>(null);
  const comparisonImageRef = useRef<HTMLImageElement>(null);
  const comparisonDraggingRef = useRef(false);
  const panDraggingRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const [comparisonBounds, setComparisonBounds] =
    useState<ComparisonBounds | null>(null);
  const comparisonHandlePosition = clampComparisonPosition(comparisonPosition);

  const readComparisonBounds = useCallback(() => {
    const stage = comparisonStageRef.current;
    const image = comparisonImageRef.current;
    if (!stage || !image) return null;

    const stageRect = stage.getBoundingClientRect();
    if (stageRect.width === 0 || stageRect.height === 0) return null;
    if (image.naturalWidth === 0 || image.naturalHeight === 0) return null;

    const fitScale = Math.min(
      stageRect.width / image.naturalWidth,
      stageRect.height / image.naturalHeight,
    );
    const shrinkScale = Math.min(zoom, 1);
    const width = image.naturalWidth * fitScale * shrinkScale;
    const height = image.naturalHeight * fitScale * shrinkScale;

    return {
      left: (stageRect.width - width) / 2,
      top: (stageRect.height - height) / 2,
      width,
      height,
    } satisfies ComparisonBounds;
  }, [zoom]);

  const measureComparisonBounds = useCallback(() => {
    const next = readComparisonBounds();
    if (!next) return;

    setComparisonBounds((current) => {
      if (
        current &&
        Math.abs(current.left - next.left) < 0.5 &&
        Math.abs(current.top - next.top) < 0.5 &&
        Math.abs(current.width - next.width) < 0.5 &&
        Math.abs(current.height - next.height) < 0.5
      ) {
        return current;
      }
      return next;
    });
  }, [readComparisonBounds]);

  const setComparisonFromClientX = useCallback(
    (clientX: number) => {
      const stage = comparisonStageRef.current;
      const bounds = readComparisonBounds();
      if (!stage || !bounds) return;

      const stageRect = stage.getBoundingClientRect();
      if (bounds.width === 0) return;

      setComparisonPosition(
        clampComparisonPosition(
          ((clientX - stageRect.left - bounds.left) / bounds.width) * 100,
        ),
      );
    },
    [readComparisonBounds, setComparisonPosition],
  );

  const startComparisonDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      comparisonDraggingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      setComparisonFromClientX(event.clientX);
    },
    [setComparisonFromClientX],
  );

  const moveComparisonDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!comparisonDraggingRef.current) return;
      event.preventDefault();
      setComparisonFromClientX(event.clientX);
    },
    [setComparisonFromClientX],
  );

  const stopComparisonDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      comparisonDraggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [],
  );

  const handleComparisonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setComparisonPosition(clampComparisonPosition(comparisonPosition - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setComparisonPosition(clampComparisonPosition(comparisonPosition + 1));
      } else if (event.key === "Home") {
        event.preventDefault();
        setComparisonPosition(0);
      } else if (event.key === "End") {
        event.preventDefault();
        setComparisonPosition(100);
      }
    },
    [comparisonPosition, setComparisonPosition],
  );

  useEffect(() => {
    if (!canCompare || view !== "comparison") return;

    const frame = window.requestAnimationFrame(measureComparisonBounds);
    return () => window.cancelAnimationFrame(frame);
  }, [
    canCompare,
    measureComparisonBounds,
    panelsCollapsed,
    previewUrl,
    resultUrl,
    view,
    zoom,
  ]);

  useEffect(() => {
    if (!canCompare || view !== "comparison") return;
    const stage = comparisonStageRef.current;
    const image = comparisonImageRef.current;
    if (!stage || !image) return;

    const resizeObserver = new ResizeObserver(measureComparisonBounds);
    resizeObserver.observe(stage);
    resizeObserver.observe(image);
    window.addEventListener("resize", measureComparisonBounds);
    const frame = window.requestAnimationFrame(measureComparisonBounds);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureComparisonBounds);
    };
  }, [canCompare, measureComparisonBounds, view]);

  const comparisonFrameStyle = comparisonBounds
    ? ({
        left: comparisonBounds.left,
        top: comparisonBounds.top,
        width: comparisonBounds.width,
        height: comparisonBounds.height,
      } satisfies CSSProperties)
    : undefined;

  const comparisonClipStyle = {
    clipPath: `inset(0 ${100 - comparisonHandlePosition}% 0 0)`,
  } satisfies CSSProperties;

  const comparisonHandleStyle = {
    left: `${comparisonHandlePosition}%`,
  } satisfies CSSProperties;

  const canShowComparisonOverlay = Boolean(
    comparisonBounds &&
      comparisonBounds.width > 0 &&
      comparisonBounds.height > 0,
  );
  const hasCanvasContent =
    studioMode === "texture" ? Boolean(textureCanvas) : Boolean(shownImage);
  const showTopToolbar =
    hasUploadedImage ||
    editAvailable ||
    panelsCollapsed ||
    (studioMode === "texture" && Boolean(textureToolbar));
  const showZoomControls = Boolean(
    studioMode === "texture" ? textureCanvas : shownImage,
  );
  const canRemoveImage = Boolean(
    allowRemoveImage && hasUploadedImage && !isProcessing,
  );
  const zoomFrameStyle = {
    width: `${Math.max(zoom, 1) * 100}%`,
    height: `${Math.max(zoom, 1) * 100}%`,
  } satisfies CSSProperties;
  const zoomSurfaceStyle = {
    width: `${Math.min(zoom, 1) * 100}%`,
    height: `${Math.min(zoom, 1) * 100}%`,
  } satisfies CSSProperties;
  const canPanCanvas =
    hasCanvasContent && studioMode !== "texture" && view !== "comparison";
  const canvasCursorStyle =
    canPanCanvas && zoom > 1
      ? ({
          cursor: "default",
        } satisfies CSSProperties)
      : undefined;

  const startCanvasPan = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canPanCanvas || zoom <= 1 || event.button !== 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      panDraggingRef.current = true;
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        left: canvas.scrollLeft,
        top: canvas.scrollTop,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [canPanCanvas, zoom],
  );

  const moveCanvasPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!panDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.scrollLeft =
      panStartRef.current.left - (event.clientX - panStartRef.current.x);
    canvas.scrollTop =
      panStartRef.current.top - (event.clientY - panStartRef.current.y);
    event.preventDefault();
  }, []);

  const stopCanvasPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!panDraggingRef.current) return;
    panDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasCanvasContent) return;

    const handleCanvasWheel = (event: WheelEvent) => {
      if (!hasCanvasContent) return;
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (delta === 0) return;

      const speed = event.ctrlKey || event.metaKey ? 0.006 : 0.0025;
      setZoom((value) => value - delta * speed);
    };

    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleCanvasWheel);
    };
  }, [hasCanvasContent, setZoom]);

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      {showTopToolbar && (
        /* Sticky toolbar: view tabs (+ Edit) + canvas controls. */
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-2 sm:items-center sm:gap-3",
            !panelsCollapsed &&
              "rounded-lg border border-border/80 bg-card px-2.5 py-2 shadow-soft",
          )}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {panelsCollapsed && onExpandPanels && (
              // Reopen control, grouped with the view tabs (desktop only).
              <div className="hidden items-center rounded-md bg-muted/80 p-1 shadow-soft lg:inline-flex">
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
              // Desktop/tablet keeps Edit near the view tabs; mobile gets it on
              // the right so the toolbar still feels balanced.
              <div className="hidden items-center rounded-md bg-muted/80 p-1 sm:inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    setView("result");
                    setStudioMode?.("texture");
                  }}
                  aria-pressed={studioMode === "texture"}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-sm px-3 text-xs font-medium transition-colors [&_svg]:size-3.5",
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

          {studioMode === "texture" && textureToolbar ? (
            <>
              {editAvailable && (
                <div className="inline-flex h-8 items-center rounded-md bg-muted/80 p-1 shadow-soft sm:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setView("result");
                      setStudioMode?.("texture");
                    }}
                    aria-pressed={studioMode === "texture"}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-sm px-3 text-xs font-medium transition-colors [&_svg]:size-3.5",
                      studioMode === "texture"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <Pencil /> Edit
                  </button>
                </div>
              )}
              <div className="basis-full overflow-x-auto sm:min-w-0 sm:basis-auto">
                {textureToolbar}
              </div>
            </>
          ) : (
            <div className="flex shrink-0 items-center">
              {editAvailable && (
                <div className="inline-flex h-8 items-center rounded-md bg-muted/80 p-1 shadow-soft sm:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setView("result");
                      setStudioMode?.("texture");
                    }}
                    aria-pressed={studioMode === "texture"}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-sm px-3 text-xs font-medium transition-colors [&_svg]:size-3.5",
                      studioMode === "texture"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-card hover:text-foreground",
                    )}
                  >
                    <Pencil /> Edit
                  </button>
                </div>
              )}
              {!editAvailable && canRemoveImage && (
                <div className="inline-flex h-8 items-center rounded-md bg-muted/80 p-1 shadow-soft sm:hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => pickFile(null)}
                    aria-label="Hapus gambar"
                    title="Hapus gambar"
                    className="size-6"
                  >
                    <X />
                  </Button>
                </div>
              )}
              {showZoomControls && (
                <div className="hidden h-8 items-center gap-0.5 rounded-md bg-muted/80 p-1 shadow-soft sm:inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    aria-label="Zoom out"
                    title="Zoom out"
                    className="size-6"
                  >
                    <ZoomOut />
                  </Button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="h-6 min-w-10 rounded-md px-1.5 text-xs font-semibold text-foreground hover:bg-card sm:min-w-11"
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
                    className="size-6"
                  >
                    <ZoomIn />
                  </Button>
                  {canRemoveImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => pickFile(null)}
                      aria-label="Hapus gambar"
                      title="Hapus gambar"
                      className="size-6"
                    >
                      <X />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        ref={canvasRef}
        onPointerDown={startCanvasPan}
        onPointerMove={moveCanvasPan}
        onPointerUp={stopCanvasPan}
        onPointerCancel={stopCanvasPan}
        className={cn(
          "relative aspect-[4/3] overflow-auto rounded-lg overscroll-contain lg:aspect-auto lg:min-h-0 lg:flex-1",
          hasCanvasContent
            ? "bg-transparent"
            : "border border-dashed border-border bg-muted/35",
        )}
        style={canvasCursorStyle}
      >
        {studioMode === "texture" ? (
          textureCanvas ?? (
            <p className="flex min-h-full min-w-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              Tidak ada gambar hasil untuk diedit.
            </p>
          )
        ) : canCompare && view === "comparison" ? (
          <div
            ref={comparisonStageRef}
            className="relative min-h-full min-w-full"
            style={zoomFrameStyle}
          >
            <RenderImage
              ref={comparisonImageRef}
              src={previewUrl ?? ""}
              alt=""
              draggable={false}
              onLoad={measureComparisonBounds}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full select-none object-contain opacity-0"
            />

            {canShowComparisonOverlay && comparisonFrameStyle && (
              <div className="absolute" style={comparisonFrameStyle}>
                <RenderImage
                  src={previewUrl ?? ""}
                  alt="Gambar asli"
                  draggable={false}
                  className="size-full select-none object-contain"
                />
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                  style={comparisonClipStyle}
                >
                  <RenderImage
                    src={resultUrl ?? ""}
                    alt="Hasil render"
                    draggable={false}
                    className="size-full select-none object-contain"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-overlay-foreground shadow-floating"
                  style={comparisonHandleStyle}
                />
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Geser komparasi"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(comparisonHandlePosition)}
                  onKeyDown={handleComparisonKeyDown}
                  onPointerDown={startComparisonDrag}
                  onPointerMove={moveComparisonDrag}
                  onPointerUp={stopComparisonDrag}
                  onPointerCancel={stopComparisonDrag}
                  className="absolute inset-0 z-10 cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <div
                  className="pointer-events-none absolute top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
                  style={comparisonHandleStyle}
                >
                  <span className="hidden rounded-full border border-border bg-background/95 px-2 py-0.5 text-xs font-semibold text-foreground shadow-floating sm:inline-flex">
                    Hasil
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-floating">
                    <ArrowLeftRight className="size-4" />
                  </span>
                  <span className="hidden rounded-full border border-border bg-background/95 px-2 py-0.5 text-xs font-semibold text-foreground shadow-floating sm:inline-flex">
                    Asli
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : shownImage ? (
          <div className="relative min-h-full min-w-full" style={zoomFrameStyle}>
            <RenderImage
              src={shownImage}
              alt={view === "result" ? "Hasil render" : "Gambar asli"}
              className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-contain"
              style={zoomSurfaceStyle}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
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
                <Label>Gambar referensi</Label>
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
    </div>
  );
}
