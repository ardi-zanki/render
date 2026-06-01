import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { listAllPayments } from "@/lib/admin/service";
import type { BadgeVariant } from "@/lib/renders/labels";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Pembayaran" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const PAY_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  paid: { label: "Lunas", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "secondary" },
  cancelled: { label: "Batal", variant: "secondary" },
  refunded: { label: "Refund", variant: "info" },
};

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const rows = await listAllPayments();

  return (
    <AdminTable
      headers={[
        { label: "Order" },
        { label: "User" },
        { label: "Kredit" },
        { label: "Nominal", align: "right" },
        { label: "Status" },
        { label: "Waktu" },
      ]}
      isEmpty={rows.length === 0}
      empty="Belum ada transaksi."
    >
      {rows.map((p) => {
        const s = PAY_STATUS[p.status] ?? {
          label: p.status,
          variant: "secondary" as BadgeVariant,
        };
        return (
          <tr key={p.id} className="hover:bg-muted/30">
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
              {p.orderId}
            </td>
            <td className="px-4 py-3 font-medium text-foreground">
              {p.userName}
            </td>
            <td className="px-4 py-3">{idr.format(p.credits)}</td>
            <td className="px-4 py-3 text-right font-mono tabular-nums">
              Rp{idr.format(p.amount)}
            </td>
            <td className="px-4 py-3">
              <Badge variant={s.variant}>{s.label}</Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {dateFmt.format(p.createdAt)}
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
