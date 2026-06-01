import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { listPaymentPackages } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Payment Packages" };

const idr = new Intl.NumberFormat("id-ID");

export default async function AdminPackagesPage() {
  await requireAdmin();
  const rows = await listPaymentPackages();

  return (
    <AdminTable
      headers={[
        { label: "Paket" },
        { label: "Slug" },
        { label: "Harga", align: "right" },
        { label: "Kredit", align: "right" },
        { label: "Status" },
      ]}
      isEmpty={rows.length === 0}
      empty="Belum ada paket."
    >
      {rows.map((p) => (
        <tr key={p.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
            {p.slug}
          </td>
          <td className="px-4 py-3 text-right font-mono tabular-nums">
            Rp{idr.format(p.price)}
          </td>
          <td className="px-4 py-3 text-right font-mono tabular-nums">
            {idr.format(p.credits + p.bonusCredits)}
          </td>
          <td className="px-4 py-3">
            {p.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
