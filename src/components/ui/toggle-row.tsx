import type { ComponentProps, MouseEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ToggleRowProps = Omit<ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  icon?: LucideIcon;
  label: ReactNode;
};

function ToggleRow({
  checked,
  onCheckedChange,
  icon: Icon,
  label,
  className,
  onClick,
  type = "button",
  ...props
}: ToggleRowProps) {
  const handleClick =
    onClick || onCheckedChange
      ? (event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (!event.defaultPrevented) onCheckedChange?.(!checked);
        }
      : undefined;

  return (
    <button
      type={type}
      aria-pressed={checked}
      data-state={checked ? "checked" : "unchecked"}
      {...(handleClick ? { onClick: handleClick } : {})}
      className={cn(
        "flex h-10 cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50",
        checked
          ? "border-primary bg-accent text-primary"
          : "border-border bg-secondary/60 text-foreground hover:border-primary/40",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="truncate">{label}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/25",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-background shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

export { ToggleRow };
