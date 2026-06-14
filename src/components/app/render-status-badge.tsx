import type { RenderStatus } from "@/db/schema";
import { STATUS_LABEL } from "@/lib/renders/labels";
import { cn } from "@/lib/utils";

const statusTone: Record<RenderStatus, string> = {
  queued: "border-warning/25 text-warning before:bg-warning",
  processing: "border-warning/25 text-warning before:bg-warning",
  success: "border-success/25 text-success before:bg-success",
  failed: "border-destructive/25 text-destructive before:bg-destructive",
  cancelled: "border-border/80 text-muted-foreground before:bg-muted-foreground",
  refunded: "border-info/25 text-info before:bg-info",
};

export function RenderStatusBadge({
  status,
  className,
}: {
  status: RenderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-[calc(100%-1rem)] items-center gap-1.5 whitespace-nowrap rounded-md border bg-card/95 px-2 text-[11px] font-semibold leading-none shadow-floating backdrop-blur-sm",
        "before:block before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        statusTone[status],
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
