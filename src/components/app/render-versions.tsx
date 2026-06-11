"use client";

import { ImageIcon } from "lucide-react";
import { useState } from "react";

import { RenderImage } from "@/components/app/render-image";
import { RenderImagePreview } from "@/components/app/render-image-preview";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RenderVersion = { id: string; label: string; fileUrl: string };

function Panel({ title, src }: { title: string; src: string | null }) {
  return (
    <figure className="border-b border-border bg-muted md:border-b-0 md:border-r md:last:border-r-0">
      <figcaption className="border-b border-border bg-card px-4 py-2 text-sm font-semibold">
        {title}
      </figcaption>
      <div className="flex aspect-square items-center justify-center">
        {src ? (
          <RenderImagePreview src={src} alt={title} className="size-full" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-sm">Belum tersedia</span>
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * Detail-page gallery: original image alongside the selected version, with a
 * version-history strip (Hasil render, Edit 1, Edit 2, …) to browse all versions.
 */
export function RenderVersions({
  originalUrl,
  versions,
}: {
  originalUrl: string | null;
  versions: RenderVersion[];
}) {
  const [selected, setSelected] = useState(Math.max(0, versions.length - 1));
  const current = versions[selected];

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Panel title="Gambar asli" src={originalUrl} />
          <Panel
            title={current?.label ?? "Hasil render"}
            src={current?.fileUrl ?? null}
          />
        </div>
      </Card>

      {versions.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Riwayat versi</p>
          <div className="flex flex-wrap gap-2.5">
            {versions.map((version, index) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
                className={cn(
                  "group flex w-24 flex-col gap-1 rounded-lg border bg-card p-1 text-left transition-colors",
                  selected === index
                    ? "border-primary/70 ring-1 ring-primary/15"
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
                <span className="truncate px-1 pb-0.5 text-xs font-medium text-foreground">
                  {version.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
