"use client";

import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudioVersion } from "./types";

/**
 * Scene History: the versions of the render being edited. Selecting one loads
 * its config into the controls and its image onto the canvas so the user can
 * continue editing from that version.
 */
export function StudioVersionHistory({
  versions,
  activeId,
  onSelect,
}: {
  versions: StudioVersion[];
  activeId: string | null;
  onSelect: (version: StudioVersion) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Riwayat versi</h2>
        <Badge variant="secondary">{versions.length}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {versions.map((version) => (
          <button
            key={version.id}
            type="button"
            onClick={() => onSelect(version)}
            aria-pressed={activeId === version.id}
            title={version.label}
            className={cn(
              "flex flex-col gap-1 rounded-lg border bg-card p-1 text-left transition-colors",
              activeId === version.id
                ? "border-primary ring-1 ring-primary/30"
                : "border-border hover:border-primary/40",
            )}
          >
            <span className="aspect-square overflow-hidden rounded-md bg-muted">
              <RenderImage
                src={version.fileUrl}
                alt={version.label}
                className="size-full"
              />
            </span>
            <span className="truncate px-0.5 pb-0.5 text-[11px] font-medium text-foreground">
              {version.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
