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
        "flex size-7 items-center justify-center rounded-sm transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
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

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <div className="inline-flex items-center gap-0.5 rounded-md bg-muted/80 p-1">
        {TOOLS.map((t) => (
          <ToolButton
            key={t.value}
            active={tool === t.value}
            label={t.label}
            icon={t.icon}
            onClick={() => setTool(t.value)}
          />
        ))}
      </div>

      {isBrush && (
        <label className="inline-flex items-center gap-2 rounded-md bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground">
          Ukuran
          <input
            type="range"
            min={BRUSH_MIN}
            max={BRUSH_MAX}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="h-1 w-24 accent-primary"
            aria-label="Ukuran brush"
          />
          <span className="w-6 text-right font-mono text-foreground">
            {brushSize}
          </span>
        </label>
      )}

      {tool === "wand" && (
        <label className="inline-flex items-center gap-2 rounded-md bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground">
          Toleransi
          <input
            type="range"
            min={0}
            max={100}
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="h-1 w-24 accent-primary"
            aria-label="Toleransi magic wand"
          />
          <span className="w-6 text-right font-mono text-foreground">
            {tolerance}
          </span>
        </label>
      )}

      <div className="inline-flex items-center gap-0.5 rounded-md bg-muted/80 p-1">
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
            className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"
          >
            {downloading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
