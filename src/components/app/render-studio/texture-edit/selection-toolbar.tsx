"use client";

import {
  Download,
  Eraser,
  Hand,
  Lasso,
  Loader2,
  Paintbrush,
  Redo2,
  Trash2,
  Undo2,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRUSH_MAX, BRUSH_MIN, type TextureTool } from "./types";

const TOOLS: { value: TextureTool; label: string; icon: LucideIcon }[] = [
  { value: "wand", label: "Magic Wand", icon: Wand2 },
  { value: "lasso", label: "Lasso", icon: Lasso },
  { value: "brush-add", label: "Brush tambah", icon: Paintbrush },
  { value: "brush-erase", label: "Brush hapus", icon: Eraser },
  { value: "pan", label: "Geser", icon: Hand },
];

function ToolButton({
  active,
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  active?: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-5 items-center justify-center rounded-sm transition-colors disabled:pointer-events-none disabled:opacity-40 sm:size-6 [&_svg]:size-3 sm:[&_svg]:size-3.5",
        active
          ? "bg-card text-primary shadow-soft"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon />
    </button>
  );
}

export function SelectionToolbar({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  tolerance,
  setTolerance,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onDownload,
  downloading = false,
}: {
  tool: TextureTool;
  setTool: (tool: TextureTool) => void;
  brushSize: number;
  setBrushSize: (value: number) => void;
  tolerance: number;
  setTolerance: (value: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  /** Download the current result without leaving Edit mode. */
  onDownload?: () => void;
  downloading?: boolean;
}) {
  const isBrush = tool === "brush-add" || tool === "brush-erase";
  const showSlider = isBrush || tool === "wand";

  return (
    <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-md border border-border/70 bg-background/90 p-1 shadow-floating backdrop-blur sm:gap-1">
      {TOOLS.map((t) => (
        <ToolButton
          key={t.value}
          active={tool === t.value}
          label={t.label}
          icon={t.icon}
          onClick={() => setTool(t.value)}
        />
      ))}

      {showSlider && (
        <>
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border/80 sm:h-5" />
          <label className="inline-flex h-5 items-center gap-1 rounded-sm px-1 text-micro text-muted-foreground sm:h-6 sm:gap-1.5 sm:px-1.5">
            <span className="hidden sm:inline">{isBrush ? "Ukuran" : "Toleransi"}</span>
            <input
              type="range"
              min={isBrush ? BRUSH_MIN : 0}
              max={isBrush ? BRUSH_MAX : 100}
              value={isBrush ? brushSize : tolerance}
              onChange={(e) =>
                isBrush
                  ? setBrushSize(Number(e.target.value))
                  : setTolerance(Number(e.target.value))
              }
              className="h-1 w-16 accent-primary sm:w-20"
              aria-label={isBrush ? "Ukuran brush" : "Toleransi magic wand"}
            />
            <span className="w-4 text-right font-mono text-foreground sm:w-5">
              {isBrush ? brushSize : tolerance}
            </span>
          </label>
        </>
      )}

      <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border/80 sm:h-5" />
      <ToolButton
        label="Undo"
        icon={Undo2}
        onClick={onUndo}
        disabled={!canUndo}
      />
      <ToolButton
        label="Redo"
        icon={Redo2}
        onClick={onRedo}
        disabled={!canRedo}
      />
      <ToolButton label="Hapus seleksi" icon={Trash2} onClick={onClear} />
      {onDownload && (
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          aria-label="Unduh hasil"
          title="Unduh hasil"
          className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 sm:size-6 [&_svg]:size-3 sm:[&_svg]:size-3.5"
        >
          {downloading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Download />
          )}
        </button>
      )}
    </div>
  );
}
