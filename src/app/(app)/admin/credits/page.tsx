import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import type { CreditTxType } from "@/db/schema";
import {
  countCreditTransactions,
  listCreditTransactions,
} from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Credit Transactions" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function parseType(value?: string): CreditTxType | undefined {
  if (
    value === "purchase" ||
    value === "usage" ||
    value === "refund" ||
    value === "bonus" ||
    value === "adjustment"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; type?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, type } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    type: parseType(type),
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listCreditTransactions(pageSize, (page - 1) * pageSize, filters),
    countCreditTransactions(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari user atau deskripsi transaksi"
        resetHref="/admin/credits"
        filters={[
          {
            name: "type",
            label: "Tipe",
            value: filters.type,
            options: [
              { label: "Semua tipe", value: "" },
              { label: "Purchase", value: "purchase" },
              { label: "Usage", value: "usage" },
              { label: "Refund", value: "refund" },
              { label: "Bonus", value: "bonus" },
              { label: "Adjustment", value: "adjustment" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "User" },
          { label: "Type" },
          { label: "Amount", align: "right" },
          { label: "Balance" },
          { label: "Deskripsi" },
          { label: "Waktu" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada transaksi kredit yang cocok."
      >
        {rows.map((tx) => (
          <tr key={tx.id} className="hover:bg-muted/30">
            <td className="px-4 py-3 font-medium text-foreground">
              {tx.userName}
            </td>
            <td className="px-4 py-3">
              <Badge variant="secondary">{tx.type}</Badge>
            </td>
            <td className="px-4 py-3 text-right font-mono tabular-nums">
              {tx.amount > 0 ? "+" : ""}
              {idr.format(tx.amount)}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
              {idr.format(tx.balanceBefore)} {"->"} {idr.format(tx.balanceAfter)}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {tx.description ?? "-"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {dateFmt.format(tx.createdAt)}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
