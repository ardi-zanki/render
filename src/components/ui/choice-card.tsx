import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ChoiceCardProps = ComponentProps<"button"> & {
  active?: boolean;
  icon?: LucideIcon;
  label: ReactNode;
  description?: ReactNode;
};

function ChoiceCard({
  active = false,
  icon: Icon,
  label,
  description,
  className,
  type = "button",
  ...props
}: ChoiceCardProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      data-state={active ? "checked" : "unchecked"}
      className={cn(
        "flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{label}</span>
        {description && (
          <span className="text-xs font-normal leading-5 text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

export { ChoiceCard };
