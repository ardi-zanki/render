import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { listAllRenders } from "@/lib/admin/service";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminRendersPage() {
  await requireAdmin();
  const rows = await listAllRenders();

  return (
    <AdminTable
      headers={[
        { label: "User" },
        { label: "Mode" },
        { label: "Status" },
        { label: "Waktu" },
      ]}
      isEmpty={rows.length === 0}
      empty="Belum ada render."
    >
      {rows.map((r) => (
        <tr key={r.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium text-foreground">
            {r.userName}
          </td>
          <td className="px-4 py-3">{MODE_LABEL[r.mode]}</td>
          <td className="px-4 py-3">
            <Badge variant={statusBadgeVariant(r.status)}>
              {STATUS_LABEL[r.status] ?? r.status}
            </Badge>
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            {dateFmt.format(r.createdAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
