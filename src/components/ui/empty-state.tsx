import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Centered empty-state block for lists/sections with no data yet. */
function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/85 bg-card/70 px-5 py-6 text-center",
        className,
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
