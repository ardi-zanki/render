"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const base =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2.5 text-sm font-medium transition-colors";

/** Page navigation that preserves existing query params (filters, tabs). */
export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Compact window of up to 5 page numbers around the current page.
  const end = Math.min(totalPages, Math.max(page + 2, 5));
  const start = Math.max(1, end - 4);
  const numbers: number[] = [];
  for (let p = start; p <= end; p++) numbers.push(p);

  return (
    <nav
      className="mt-6 flex items-center justify-center gap-1.5"
      aria-label="Paginasi"
    >
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(base, "border-input bg-card hover:bg-muted")}
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(base, "border-border text-muted-foreground opacity-50")}
          aria-disabled
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {numbers.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            base,
            p === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-card text-foreground hover:bg-muted",
          )}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(base, "border-input bg-card hover:bg-muted")}
          aria-label="Berikutnya"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(base, "border-border text-muted-foreground opacity-50")}
          aria-disabled
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
