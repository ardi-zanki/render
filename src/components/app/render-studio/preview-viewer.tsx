"use client";

import {
  ArrowLeftRight,
  ImagePlus,
  Loader2,
  PanelLeft,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

import { RenderImage } from "@/components/app/render-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode } from "@/db/schema";
import { cn } from "@/lib/utils";
import type { StudioView, ViewerTab } from "./types";
import { clampZoom } from "./use-render-studio-state";

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
  editAvailable = false,
  studioMode = "render",
  setStudioMode,
  panelsCollapsed = false,
  onExpandPanels,
  textureCanvas,
  textureToolbar,
  texturePanActive = false,
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
  /** Let the Hand tool pan the texture canvas (drag to move at any zoom). */
  texturePanActive?: boolean;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const comparisonStageRef = useRef<HTMLDivElement>(null);
  const comparisonImageRef = useRef<HTMLImageElement>(null);
  const comparisonDraggingRef = useRef(false);
  const panDraggingRef = useRef(false);
  // Free pan offset (CSS px) applied as a transform — works at any zoom, unlike
  // the old scroll model that needed the content to overflow (zoom > 100%).
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Drop-to-upload: allowed while the image can still be replaced (a fresh
  // upload that hasn't been rendered yet), and never mid-render.
  const dropEnabled = allowRemoveImage && !isProcessing && studioMode !== "texture";

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!dropEnabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!dropEnabled) return;
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }

  // Recenter when the content or view changes so a fresh image starts fitted.
  // Adjusting state during render (React's documented pattern) avoids an extra
  // effect pass — https://react.dev/learn/you-might-not-need-an-effect.
  const panResetKey = `${shownImage}|${studioMode}|${view}`;
  const [lastPanResetKey, setLastPanResetKey] = useState(panResetKey);
  if (panResetKey !== lastPanResetKey) {
    setLastPanResetKey(panResetKey);
    setPan({ x: 0, y: 0 });
  }
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
  // Comparison keeps the shrink-to-fit frame; the image/texture views pan & zoom
  // through canvasTransformStyle instead.
  const zoomFrameStyle = {
    width: `${Math.max(zoom, 1) * 100}%`,
    height: `${Math.max(zoom, 1) * 100}%`,
  } satisfies CSSProperties;
  const canPanCanvas =
    hasCanvasContent &&
    view !== "comparison" &&
    (studioMode !== "texture" || texturePanActive);
  const canvasTransformStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "center center",
  } satisfies CSSProperties;
  // Persistent backdrop image, kept on one stable <img> across mode/view changes
  // so swapping subtrees (Edit ↔ Hasil/Komparasi) never shows a blank frame: the
  // browser holds the old frame until the new src decodes.
  const baseImageSrc =
    studioMode === "texture" || view === "comparison"
      ? resultUrl
      : shownImage;
  const canvasCursorStyle = canPanCanvas
    ? ({
        cursor: isCanvasPanning ? "grabbing" : "grab",
      } satisfies CSSProperties)
    : undefined;

  const startCanvasPan = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!canPanCanvas || event.button !== 0) return;
      panDraggingRef.current = true;
      setIsCanvasPanning(true);
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [canPanCanvas, pan.x, pan.y],
  );

  const moveCanvasPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!panDraggingRef.current) return;
    setPan({
      x: panStartRef.current.panX + (event.clientX - panStartRef.current.x),
      y: panStartRef.current.panY + (event.clientY - panStartRef.current.y),
    });
    event.preventDefault();
  }, []);

  const stopCanvasPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!panDraggingRef.current) return;
    panDraggingRef.current = false;
    setIsCanvasPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasCanvasContent) return;

    const handleCanvasWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (delta === 0) return;

      const nextZoom = clampZoom(zoom - delta * 0.006);
      if (nextZoom === zoom) return;

      // Comparison has no pan — just zoom.
      if (view === "comparison") {
        setZoom(nextZoom);
        return;
      }

      // Zoom toward the cursor: keep the point under it anchored.
      const rect = canvas.getBoundingClientRect();
      const cx = event.clientX - rect.left - rect.width / 2;
      const cy = event.clientY - rect.top - rect.height / 2;
      const ratio = nextZoom / zoom;
      setPan((prev) => ({
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      }));
      setZoom(nextZoom);
    };

    canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleCanvasWheel);
    };
  }, [hasCanvasContent, setZoom, view, zoom]);

  return (
    <div className="relative flex flex-col lg:h-full lg:min-h-0">
      {showTopToolbar && (
        /* Floating bottom-center toolbar (Framer/Figma style): view tabs (+ Edit)
           and canvas controls / texture tools, content-sized so it never
           stretches and stays centered when the panels are hidden. */
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3">
          <div className="pointer-events-auto inline-flex max-w-full items-center gap-1.5 overflow-x-auto rounded-xl border border-border/80 bg-card/95 px-1.5 py-1.5 shadow-floating backdrop-blur transition-all duration-200 ease-out">
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
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
            {hasUploadedImage && (
              <Segmented
                className="shrink-0"
                options={viewerTabs}
                value={view}
                onChange={(value) => {
                  setStudioMode?.("render");
                  setView(value);
                }}
                size="sm"
              />
            )}
            {editAvailable && (
              <div className="inline-flex shrink-0 items-center rounded-md bg-muted/80 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setView("result");
                    setStudioMode?.("texture");
                  }}
                  aria-pressed={studioMode === "texture"}
                  className={cn(
                    "inline-flex h-6 items-center rounded-sm px-3 text-xs font-medium transition-colors",
                    studioMode === "texture"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Edit tools (only in texture mode) and zoom controls live in the
              same row; the pill scrolls horizontally rather than wrapping. */}
          {studioMode === "texture" && textureToolbar && (
            <>
              <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border/70" />
              <div className="shrink-0">{textureToolbar}</div>
            </>
          )}

          {showZoomControls && (
            <>
              <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border/70" />
              <div className="inline-flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  disabled={zoom <= 0.25}
                  aria-label="Zoom out"
                  title="Zoom out"
                  className="size-6"
                >
                  <ZoomOut />
                </Button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="h-6 min-w-11 rounded-md px-1.5 text-xs font-semibold text-foreground hover:bg-card"
                  title="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={zoomIn}
                  disabled={zoom >= 5}
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
            </>
          )}
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        onPointerDown={startCanvasPan}
        onPointerMove={moveCanvasPan}
        onPointerUp={stopCanvasPan}
        onPointerCancel={stopCanvasPan}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative aspect-[4/3] overscroll-contain rounded-lg lg:aspect-auto lg:min-h-0 lg:flex-1 lg:rounded-none",
          // Comparison keeps its scrollable frame; image/texture views clip the
          // transform so panned content disappears at the viewport edge, and
          // claim touch gestures so a drag pans instead of scrolling the page.
          view === "comparison"
            ? "overflow-auto"
            : "overflow-hidden touch-none",
          // No frame around the canvas — it runs flush to the panels and header.
          hasCanvasContent ? "bg-transparent" : "bg-muted/20",
        )}
        style={canvasCursorStyle}
      >
        {baseImageSrc && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={canvasTransformStyle}
          >
            <RenderImage
              src={baseImageSrc}
              alt=""
              draggable={false}
              loading="eager"
              className="size-full select-none object-contain"
            />
          </div>
        )}
        {studioMode === "texture" ? (
          textureCanvas ? (
            <div className="absolute inset-0" style={canvasTransformStyle}>
              {textureCanvas}
            </div>
          ) : (
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
              loading="eager"
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
                  loading="eager"
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
                    loading="eager"
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
          <div className="absolute inset-0" style={canvasTransformStyle}>
            <RenderImage
              src={shownImage}
              alt={view === "result" ? "Hasil render" : "Gambar asli"}
              draggable={false}
              loading="eager"
              className="size-full select-none object-contain"
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
              Klik atau seret gambar desain ke sini
            </span>
            <span className="text-xs">JPG, PNG, atau WebP · maks 10MB</span>
          </button>
        )}

          {isDraggingFile && (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[1px]">
              <span className="rounded-md bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-floating">
                Lepaskan untuk {hasUploadedImage ? "mengganti" : "mengunggah"}{" "}
                gambar
              </span>
            </div>
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
                Pilih
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
                className="flex w-full items-center justify-center rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground"
              >
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
    </div>
  );
}
