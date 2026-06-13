import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import type { PaymentStatus } from "@/db/schema";
import { countAllPayments, listAllPayments } from "@/lib/admin/service";
import { PAYMENT_STATUS, paymentStatusBadge } from "@/lib/payments/labels";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Pembayaran" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function parseStatus(value?: string): PaymentStatus | undefined {
  if (
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "expired" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    provider?: string;
  }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, status, provider } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    status: parseStatus(status),
    provider: provider?.trim() || undefined,
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllPayments(pageSize, (page - 1) * pageSize, filters),
    countAllPayments(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari order, user, atau transaksi"
        resetHref="/admin/payments"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: PAYMENT_STATUS.pending.label, value: "pending" },
              { label: PAYMENT_STATUS.paid.label, value: "paid" },
              { label: PAYMENT_STATUS.failed.label, value: "failed" },
              { label: PAYMENT_STATUS.expired.label, value: "expired" },
              { label: PAYMENT_STATUS.cancelled.label, value: "cancelled" },
              { label: PAYMENT_STATUS.refunded.label, value: "refunded" },
            ],
          },
          {
            name: "provider",
            label: "Provider",
            value: filters.provider,
            options: [
              { label: "Semua provider", value: "" },
              { label: "Midtrans", value: "midtrans" },
              { label: "Mock", value: "mock" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "Order" },
          { label: "User" },
          { label: "Kredit" },
          { label: "Nominal", align: "right" },
          { label: "Provider" },
          { label: "Status" },
          { label: "Waktu" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada transaksi pembayaran yang cocok."
      >
        {rows.map((p) => {
          const s = paymentStatusBadge(p.status);
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
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {p.provider ?? "-"}
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
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
