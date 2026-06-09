import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import type { NotificationType } from "@/db/schema";
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

function parseType(value?: string): NotificationType | undefined {
  if (
    value === "render_success" ||
    value === "render_failed" ||
    value === "payment_success" ||
    value === "payment_failed" ||
    value === "low_credit" ||
    value === "email_verification" ||
    value === "system"
  ) {
    return value;
  }
  return undefined;
}

function parseStatus(value?: string): "read" | "unread" | undefined {
  if (value === "read" || value === "unread") return value;
  return undefined;
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    status?: string;
  }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, type, status } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    type: parseType(type),
    status: parseStatus(status),
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllNotifications(pageSize, (page - 1) * pageSize, filters),
    countAllNotifications(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari user, judul, atau pesan notifikasi"
        resetHref="/admin/notifications"
        filters={[
          {
            name: "type",
            label: "Tipe",
            value: filters.type,
            options: [
              { label: "Semua tipe", value: "" },
              { label: "Render sukses", value: "render_success" },
              { label: "Render gagal", value: "render_failed" },
              { label: "Payment sukses", value: "payment_success" },
              { label: "Payment gagal", value: "payment_failed" },
              { label: "Low credit", value: "low_credit" },
              { label: "Verifikasi email", value: "email_verification" },
              { label: "System", value: "system" },
            ],
          },
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: "Dibaca", value: "read" },
              { label: "Belum dibaca", value: "unread" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "User" },
          { label: "Type" },
          { label: "Judul" },
          { label: "Status" },
          { label: "Waktu" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada notifikasi yang cocok."
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
                <Badge variant="secondary">Dibaca</Badge>
              ) : (
                <Badge>Belum dibaca</Badge>
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
