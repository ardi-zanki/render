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
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/90 bg-card/60 px-5 py-9 text-center",
        className,
      )}
    >
      <div className="relative flex size-14 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-accent/50"
          aria-hidden
        />
        <span
          className="absolute inset-[6px] rounded-full bg-accent"
          aria-hidden
        />
        <Icon className="relative size-6 text-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
