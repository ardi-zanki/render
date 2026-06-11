"use client";

import type { RenderMode } from "@/db/schema";
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
    mode: RenderMode;
    outputFormat: string;
    creditsUsed: number;
  };
}) {
  const rows: [string, string][] = [
    ["Dibuat", dateFmt.format(new Date(info.createdAt))],
    ["Mode", MODE_LABEL[info.mode]],
    ["Format", info.outputFormat.toUpperCase()],
    ["Kredit", `${info.creditsUsed || 1} kredit`],
  ];
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Info Render</h2>
      <dl className="flex flex-col gap-1.5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
