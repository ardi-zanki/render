import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  countAllNotifications,
  listAllNotifications,
} from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Notifications" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllNotifications(pageSize, (page - 1) * pageSize),
    countAllNotifications(),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
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
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
