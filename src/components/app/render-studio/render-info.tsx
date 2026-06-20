"use client";

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
    { label: "Dibuat", value: dateFmt.format(new Date(info.createdAt)) },
    { label: "Diperbarui", value: dateFmt.format(new Date(info.updatedAt)) },
    { label: "Mode", value: MODE_LABEL[info.mode] },
    { label: "Format", value: info.outputFormat.toUpperCase() },
    { label: "Kredit", value: `${info.creditsUsed || 1} kredit` },
  ];
  return (
    <div className="rounded-lg border border-border/80 bg-card p-3 shadow-soft">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold text-foreground">Info Render</h2>
        </div>
        {info.editKind === "texture" && (
          <Badge variant="info">Edit Texture</Badge>
        )}
      </div>
      <dl className="flex flex-col divide-y divide-border/70">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-1.5 text-xs first:pt-0 last:pb-0"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
