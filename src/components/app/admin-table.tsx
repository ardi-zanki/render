import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminTable({
  headers,
  children,
  empty,
  isEmpty,
}: {
  headers: { label: string; align?: "right" }[];
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/85 bg-card shadow-soft">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/65 text-left text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={cn("px-4 py-2.5", h.align === "right" && "text-right")}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/80">
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-9 text-center text-muted-foreground"
              >
                {empty ?? "Belum ada data."}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
