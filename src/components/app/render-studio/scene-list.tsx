"use client";

import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import type { Scene } from "./types";

export function RenderSceneList({
  scenes,
  projectName,
}: {
  scenes: Scene[];
  projectName: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Scene · {projectName}
        </h2>
        <Badge variant="secondary">{scenes.length}</Badge>
      </div>
      {scenes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Belum ada render di project ini.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 lg:min-h-0 lg:flex-1 lg:content-start lg:overflow-y-auto lg:pr-1">
          {scenes.map((s) => (
            <div
              key={s.id}
              className="aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {s.resultUrl && (
                <RenderImage src={s.resultUrl} alt={s.mode} className="size-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
