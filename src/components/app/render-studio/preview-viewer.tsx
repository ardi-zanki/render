"use client";

import {
  ImagePlus,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { RefObject } from "react";

import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode } from "@/db/schema";
import { cn } from "@/lib/utils";
import type { StudioView, ViewerTab } from "./types";

export function RenderPreviewViewer({
  fileRef,
  referenceRef,
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
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  referenceRef: RefObject<HTMLInputElement | null>;
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
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasUploadedImage ? (
            <div
              role="tablist"
              className="inline-flex flex-wrap items-center gap-1 rounded-md bg-muted/80 p-1"
            >
              {viewerTabs.map((tab) => {
                const active = tab.value === view;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={tab.disabled}
                    onClick={() => setView(tab.value)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
                      active
                        ? "bg-card text-primary shadow-[0_1px_2px_rgb(15_23_42/0.045)]"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div />
          )}

          {shownImage && (
            <div className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-md bg-muted/80 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
                className="size-7"
              >
                <ZoomOut />
              </Button>
              <button
                type="button"
                onClick={resetZoom}
                className="h-7 min-w-11 rounded-md px-1.5 text-xs font-semibold text-foreground hover:bg-card"
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
                className="size-7"
              >
                <ZoomIn />
              </Button>
            </div>
          )}
        </div>

        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/35">
          {canCompare && view === "komparasi" ? (
            <div className="relative size-full overflow-hidden bg-background">
              <RenderImage
                src={resultUrl ?? ""}
                alt="Hasil render"
                className="size-full"
                style={{ transform: `scale(${zoom})` }}
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)`,
                }}
              >
                <RenderImage
                  src={previewUrl ?? ""}
                  alt="Gambar asli"
                  className="size-full"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
              <div
                className="absolute inset-y-0 w-px bg-background/90 shadow-[0_0_0_1px_rgb(15_23_42/0.12)]"
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
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                aria-label="Geser komparasi"
              />
              <div
                className="pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
                style={{ left: `${comparisonPosition}%` }}
              >
                <span>Asli</span>
                <span className="text-muted-foreground">|</span>
                <span>Hasil</span>
              </div>
            </div>
          ) : shownImage ? (
            <div className="size-full overflow-hidden">
              <RenderImage
                src={shownImage}
                alt={view === "hasil" ? "Hasil render" : "Gambar asli"}
                className="size-full transition-transform"
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
                Klik untuk upload gambar desain
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

          {file && !isProcessing && (
            <button
              type="button"
              onClick={() => pickFile(null)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm hover:bg-background"
              aria-label="Hapus gambar"
            >
              <X className="size-4" />
            </button>
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
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm"
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
                Upload gambar referensi style
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
