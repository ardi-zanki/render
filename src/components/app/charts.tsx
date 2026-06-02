import { cn } from "@/lib/utils";

export interface BarPoint {
  label: string;
  value: number;
  title?: string;
}

/** Dependency-free vertical bar chart. */
export function BarChart({ data }: { data: BarPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col justify-end"
            title={d.title ?? `${d.label}: ${d.value}`}
          >
            <div
              className="w-full rounded-t bg-primary/70 transition-colors hover:bg-primary"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface BreakdownItem {
  label: string;
  value: number;
}

/** Dependency-free horizontal breakdown bars. */
export function BreakdownBars({
  data,
  className,
}: {
  data: BreakdownItem[];
  className?: string;
}) {
  const total = Math.max(
    1,
    data.reduce((s, d) => s + d.value, 0),
  );
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada data.</p>
      )}
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate text-muted-foreground">
            {d.label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(d.value / total) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-medium tabular-nums">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}
