"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; disabled?: boolean };

/**
 * Segmented control for switching between a small set of mutually-exclusive
 * views or tabs. Uses a muted track with a raised card-style active pill — the
 * standard tab look across the app (settings, projects, render studio).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "default",
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-md bg-muted/80 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? "bg-card text-primary shadow-[0_1px_2px_rgb(15_23_42/0.045)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
