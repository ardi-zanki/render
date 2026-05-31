import type { PaymentStatus } from "@/db/schema";

/** Map a Midtrans `transaction_status` (+ fraud_status) to our PaymentStatus. */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string,
): PaymentStatus {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge" ? "pending" : "paid";
    case "settlement":
      return "paid";
    case "pending":
      return "pending";
    case "deny":
    case "failure":
      return "failed";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refunded";
    default:
      return "pending";
  }
}
