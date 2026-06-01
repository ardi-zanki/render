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
 * Credit balance pill for the app top bar — mirrors the reference's
 * "◇ 30 · Topup" affordance. Shows remaining credits plus a top-up CTA.
 */
function CreditPill({
  balance,
  actionLabel = "Topup",
  className,
}: CreditPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-3 pr-1 shadow-sm",
        className,
      )}
    >
      <Gem className="size-4 text-primary" />
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {balance.toLocaleString("id-ID")}
      </span>
      <Link
        href="/payments"
        className="ml-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export { CreditPill };
