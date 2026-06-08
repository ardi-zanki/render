"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

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
        "inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1",
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
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-md font-medium transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? "bg-card text-primary shadow-sm"
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
