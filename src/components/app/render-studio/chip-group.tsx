"use client";

import { cap } from "./constants";
import { cn } from "@/lib/utils";

export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "min-w-0 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            value === o
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted",
          )}
        >
          {cap(o)}
        </button>
      ))}
    </div>
  );
}
