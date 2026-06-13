import type { BadgeVariant } from "@/lib/renders/labels";

/**
 * Single source of truth for payment-status display (label + badge variant),
 * shared by the dashboard, payments page, and admin payments table so the
 * wording and colors never drift across screens.
 */
export const PAYMENT_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  paid: { label: "Lunas", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "secondary" },
  cancelled: { label: "Batal", variant: "secondary" },
  refunded: { label: "Refund", variant: "info" },
};

/** Label + badge variant for a payment status, falling back to a neutral chip. */
export function paymentStatusBadge(status: string) {
  return (
    PAYMENT_STATUS[status] ?? {
      label: status,
      variant: "secondary" as BadgeVariant,
    }
  );
}
