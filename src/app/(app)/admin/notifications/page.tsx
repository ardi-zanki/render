import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { listAllNotifications } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Notifications" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const rows = await listAllNotifications();

  return (
    <AdminTable
      headers={[
        { label: "User" },
        { label: "Type" },
        { label: "Judul" },
        { label: "Status" },
        { label: "Waktu" },
      ]}
      isEmpty={rows.length === 0}
      empty="Belum ada notifikasi."
    >
      {rows.map((n) => (
        <tr key={n.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium text-foreground">
            {n.userName}
          </td>
          <td className="px-4 py-3">
            <Badge variant="secondary">{n.type}</Badge>
          </td>
          <td className="px-4 py-3 text-muted-foreground">{n.title}</td>
          <td className="px-4 py-3">
            {n.isRead ? (
              <Badge variant="secondary">Read</Badge>
            ) : (
              <Badge>Unread</Badge>
            )}
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            {dateFmt.format(n.createdAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
