"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";
import { floodFillSelection } from "./magic-wand";
import type { MaskCanvasHandle, MaskState, TextureTool } from "./types";

const MASK_BLUE = "rgba(37, 99, 235, 1)";
const HISTORY_LIMIT = 20;

type Props = {
  /** Base image (the render version) to edit. */
  imageUrl: string;
  tool: TextureTool;
  brushSize: number;
  tolerance: number;
  /** Display zoom; pointer math stays correct via getBoundingClientRect. */
  zoom?: number;
  onChange: (state: MaskState) => void;
  /** Surface a non-fatal issue (e.g. magic wand on a cross-origin image). */
  onError?: (message: string) => void;
  className?: string;
};

/**
 * Region-selection canvas for the texture editor. The mask is kept at the
 * image's natural resolution in an offscreen canvas (white = selected); a
 * visible overlay renders it tinted blue at ~45%. Magic wand reads the source
 * pixels (flood fill by tolerance); lasso fills a free-form polygon; brush
 * add/erase paints circles. Undo/redo snapshots the mask (≥20 steps).
 */
export const MaskCanvas = forwardRef<MaskCanvasHandle, Props>(function MaskCanvas(
  { imageUrl, tool, brushSize, tolerance, zoom = 1, onChange, onError, className },
  ref,
) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const naturalRef = useRef({ w: 0, h: 0 });
  const historyRef = useRef<{ stack: ImageData[]; index: number }>({
    stack: [],
    index: 0,
  });

  // Mutable interaction state (no re-render needed mid-drag).
  const drawingRef = useRef(false);
  const lassoRef = useRef<{ x: number; y: number }[]>([]);

  const emit = useCallback(() => {
    const mask = maskRef.current;
    const h = historyRef.current;
    let hasMask = false;
    if (mask) {
      const ctx = mask.getContext("2d");
      const data = ctx?.getImageData(0, 0, mask.width, mask.height).data;
      if (data) {
        // Sample every 10th pixel's alpha — fast and enough to detect presence.
        for (let i = 3; i < data.length; i += 40) {
          if (data[i] > 0) {
            hasMask = true;
            break;
          }
        }
      }
    }
    onChange({
      hasMask,
      canUndo: h.index > 0,
      canRedo: h.index < h.stack.length - 1,
    });
  }, [onChange]);

  const renderOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    if (!overlay || !mask) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = MASK_BLUE;
    ctx.fillRect(0, 0, overlay.width, overlay.height);
    ctx.globalCompositeOperation = "source-over";
  }, []);

  const snapshot = useCallback(() => {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, mask.width, mask.height);
    const h = historyRef.current;
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(data);
    if (h.stack.length > HISTORY_LIMIT + 1) h.stack.shift();
    h.index = h.stack.length - 1;
    emit();
  }, [emit]);

  const restore = useCallback(
    (index: number) => {
      const h = historyRef.current;
      const mask = maskRef.current;
      if (!mask || index < 0 || index >= h.stack.length) return;
      const ctx = mask.getContext("2d");
      ctx?.putImageData(h.stack[index], 0, 0);
      h.index = index;
      renderOverlay();
      emit();
    },
    [emit, renderOverlay],
  );

  // (Re)load the base image whenever it changes; reset mask + history.
  useEffect(() => {
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      naturalRef.current = { w, h };

      const source = document.createElement("canvas");
      source.width = w;
      source.height = h;
      source.getContext("2d", { willReadFrequently: true })?.drawImage(img, 0, 0);
      sourceRef.current = source;

      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      maskRef.current = mask;

      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width = w;
        overlay.height = h;
      }

      const ctx = mask.getContext("2d");
      const empty = ctx?.getImageData(0, 0, w, h);
      historyRef.current = { stack: empty ? [empty] : [], index: 0 };
      renderOverlay();
      emit();
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl, renderOverlay, emit]);

  useImperativeHandle(
    ref,
    () => ({
      undo: () => restore(historyRef.current.index - 1),
      redo: () => restore(historyRef.current.index + 1),
      clear: () => {
        const mask = maskRef.current;
        mask?.getContext("2d")?.clearRect(0, 0, mask.width, mask.height);
        renderOverlay();
        snapshot();
      },
      toMaskBlob: async () => {
        const mask = maskRef.current;
        if (!mask) return null;
        const out = document.createElement("canvas");
        out.width = mask.width;
        out.height = mask.height;
        const ctx = out.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(mask, 0, 0); // white selection over black
        return new Promise<Blob | null>((resolve) =>
          out.toBlob((blob) => resolve(blob), "image/png"),
        );
      },
    }),
    [restore, renderOverlay, snapshot],
  );

  // ── pointer → source-pixel coords ──────────────────────────────────
  function toSource(e: ReactPointerEvent<HTMLCanvasElement>) {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) * (overlay.width / rect.width)),
      y: Math.round((e.clientY - rect.top) * (overlay.height / rect.height)),
      scale: overlay.width / rect.width,
    };
  }

  function paintCircle(x: number, y: number, radius: number, add: boolean) {
    const mask = maskRef.current;
    const ctx = mask?.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = add ? "source-over" : "destination-out";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1, radius), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    renderOverlay();
  }

  function magicWand(sx: number, sy: number) {
    const source = sourceRef.current;
    const mask = maskRef.current;
    if (!source || !mask) return;
    const sctx = source.getContext("2d", { willReadFrequently: true });
    const mctx = mask.getContext("2d");
    if (!sctx || !mctx) return;
    let src: ImageData;
    try {
      src = sctx.getImageData(0, 0, source.width, source.height);
    } catch {
      onError?.(
        "Magic wand tidak bisa membaca gambar ini. Coba lasso atau brush.",
      );
      return;
    }
    const { width: w, height: h } = src;
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
    const selected = floodFillSelection(src.data, w, h, sx, sy, tolerance);
    // A normal Magic Wand click starts a fresh selection. Brush Add remains the
    // explicit tool for extending it, so old lasso/brush masks cannot silently
    // accumulate into an unexpectedly huge region.
    const out = mctx.createImageData(w, h);
    const op = out.data;
    for (let point = 0; point < selected.length; point += 1) {
      if (!selected[point]) continue;
      const offset = point * 4;
      op[offset] = 255;
      op[offset + 1] = 255;
      op[offset + 2] = 255;
      op[offset + 3] = 255;
    }
    mctx.putImageData(out, 0, 0);
    renderOverlay();
  }

  function fillLasso() {
    const mask = maskRef.current;
    const ctx = mask?.getContext("2d");
    const points = lassoRef.current;
    if (!ctx || points.length < 3) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
    renderOverlay();
  }

  function drawLassoPreview() {
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    const points = lassoRef.current;
    if (!ctx || points.length < 2) return;
    renderOverlay();
    ctx.save();
    ctx.strokeStyle = MASK_BLUE;
    ctx.lineWidth = Math.max(1, overlay!.width / 360);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const active = tool;
    if (active === "pan") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y, scale } = toSource(e);
    if (active === "wand") {
      magicWand(x, y);
      drawingRef.current = false;
      snapshot();
      return;
    }
    if (active === "lasso") {
      lassoRef.current = [{ x, y }];
      return;
    }
    paintCircle(x, y, (brushSize / 2) * scale, active === "brush-add");
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const active = tool;
    const { x, y, scale } = toSource(e);
    if (active === "lasso") {
      lassoRef.current.push({ x, y });
      drawLassoPreview();
      return;
    }
    if (active === "brush-add" || active === "brush-erase") {
      paintCircle(x, y, (brushSize / 2) * scale, active === "brush-add");
    }
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (tool === "lasso") {
      fillLasso();
      lassoRef.current = [];
    }
    snapshot();
  }

  const cursor =
    tool === "pan"
      ? "grab"
      : tool === "wand"
        ? "cell"
        : "crosshair";
  const zoomFrameStyle = {
    width: `${Math.max(zoom, 1) * 100}%`,
    height: `${Math.max(zoom, 1) * 100}%`,
  } satisfies CSSProperties;
  const zoomSurfaceStyle = {
    width: `${Math.min(zoom, 1) * 100}%`,
    height: `${Math.min(zoom, 1) * 100}%`,
  } satisfies CSSProperties;

  return (
    <div
      className={cn(
        "relative flex min-h-full min-w-full shrink-0 items-center justify-center",
        className,
      )}
      style={zoomFrameStyle}
    >
      <div className="relative shrink-0" style={zoomSurfaceStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Gambar yang diedit"
          draggable={false}
          className="block size-full select-none object-contain"
        />
        <canvas
          ref={overlayRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          style={{ cursor, opacity: 0.5, touchAction: "none" }}
          className="absolute inset-0 size-full"
        />
      </div>
    </div>
  );
});
