import { Gem } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type CreditPillProps = {
  /** Current credit balance. */
  balance: number;
  /** Top-up call-to-action label. */
  actionLabel?: string;
  className?: string;
};

/**
 * Credit balance pill for the app top bar. Shows remaining credits plus a
 * top-up CTA.
 */
function CreditPill({
  balance,
  actionLabel = "Top up",
  className,
}: CreditPillProps) {
  return (
    <div
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border border-border/80 bg-card py-0.5 pl-2 pr-0.5 shadow-hairline",
        className,
      )}
    >
      <Gem className="size-3.5 text-primary" />
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {balance.toLocaleString("id-ID")}
      </span>
      <Link
        href="/payments"
        className="ml-0.5 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export { CreditPill };
