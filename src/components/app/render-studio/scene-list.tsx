"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sceneTileVariant, visibleScenes } from "./scene-status";
import type { Scene } from "./types";

const TILE_BASE = "aspect-square overflow-hidden rounded-lg border";

export function RenderSceneList({
  scenes,
  projectName,
}: {
  scenes: Scene[];
  projectName: string;
}) {
  const visible = visibleScenes(scenes);

  return (
    <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Scene · {projectName}
        </h2>
        <Badge variant="secondary">{visible.length}</Badge>
      </div>
      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Belum ada render di project ini.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 lg:min-h-0 lg:flex-1 lg:content-start lg:overflow-y-auto lg:pr-1">
          {visible.map((s) => (
            <SceneTile key={s.id} scene={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SceneTile({ scene }: { scene: Scene }) {
  switch (sceneTileVariant(scene)) {
    case "image":
      return (
        <div className={cn(TILE_BASE, "border-border bg-muted")}>
          <RenderImage
            src={scene.resultUrl!}
            alt={scene.mode}
            className="size-full"
          />
        </div>
      );
    case "failed":
      return (
        <div
          className={cn(
            TILE_BASE,
            "flex flex-col items-center justify-center gap-1.5 border-destructive/20 bg-destructive/5 text-destructive",
          )}
        >
          <AlertTriangle className="size-5" />
          <span className="text-xs font-medium">Gagal</span>
        </div>
      );
    case "processing":
      return (
        <div
          className={cn(
            TILE_BASE,
            "flex flex-col items-center justify-center gap-1.5 border-border bg-muted text-muted-foreground",
          )}
        >
          <Loader2 className="size-5 animate-spin" />
          <span className="text-xs font-medium">Memproses</span>
        </div>
      );
    default:
      // Neutral tile for an unexpected state rather than a misleading label.
      return <div className={cn(TILE_BASE, "border-border bg-muted")} />;
  }
}
