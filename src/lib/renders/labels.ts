import type { RenderMode } from "@/db/schema";

export const MODE_LABEL: Record<RenderMode, string> = {
  interior: "Interior",
  exterior: "Exterior",
  style_transfer: "Style Transfer",
  upscale: "Upscale",
};

export const STATUS_LABEL: Record<string, string> = {
  queued: "Antri",
  processing: "Proses",
  success: "Selesai",
  failed: "Gagal",
  cancelled: "Batal",
  refunded: "Refund",
};

export type BadgeVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary";

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "success":
      return "success";
    case "processing":
    case "queued":
      return "warning";
    case "failed":
      return "destructive";
    case "refunded":
      return "info";
    default:
      return "secondary";
  }
}
