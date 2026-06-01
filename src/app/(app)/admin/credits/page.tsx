import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { listCreditTransactions } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Credit Transactions" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminCreditsPage() {
  await requireAdmin();
  const rows = await listCreditTransactions();

  return (
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
      empty="Belum ada transaksi kredit."
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
  );
}
