"use client";

import { CalendarDays, Clock3, Coins, FileType, Layers3, Sofa } from "lucide-react";

import type { RenderMode } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { MODE_LABEL } from "@/lib/renders/labels";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Compact metadata of the render being edited, above the Scene panel. */
export function StudioRenderInfo({
  info,
}: {
  info: {
    createdAt: string;
    updatedAt: string;
    mode: RenderMode;
    outputFormat: string;
    creditsUsed: number;
    editKind?: "texture";
  };
}) {
  const rows = [
    { label: "Dibuat", value: dateFmt.format(new Date(info.createdAt)), icon: CalendarDays },
    { label: "Diperbarui", value: dateFmt.format(new Date(info.updatedAt)), icon: Clock3 },
    { label: "Mode", value: MODE_LABEL[info.mode], icon: Sofa },
    { label: "Format", value: info.outputFormat.toUpperCase(), icon: FileType },
    { label: "Kredit", value: `${info.creditsUsed || 1} kredit`, icon: Coins },
  ];
  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-primary">
            <Layers3 className="size-4" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">Info Render</h2>
        </div>
        {info.editKind === "texture" && (
          <Badge variant="info">Edit Texture</Badge>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-border/70">
        {rows.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0"
          >
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4 text-primary" />
              {label}
            </dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
