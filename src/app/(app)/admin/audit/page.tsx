import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Pagination } from "@/components/ui/pagination";
import { countAuditLogs, listAuditLogs } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Audit Log" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ACTION_LABEL: Record<string, string> = {
  "user.disable": "Nonaktifkan user",
  "user.enable": "Aktifkan user",
  "user.set_role": "Ubah role",
  "credit.adjustment": "Adjustment kredit",
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; action?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, action } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    action: action?.trim() || undefined,
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [logs, total] = await Promise.all([
    listAuditLogs(pageSize, (page - 1) * pageSize, filters),
    countAuditLogs(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari aksi, admin, target, atau detail"
        resetHref="/admin/audit"
        filters={[
          {
            name: "action",
            label: "Aksi",
            value: filters.action,
            options: [
              { label: "Semua aksi", value: "" },
              { label: "Nonaktifkan user", value: "user.disable" },
              { label: "Aktifkan user", value: "user.enable" },
              { label: "Ubah role", value: "user.set_role" },
              { label: "Adjustment kredit", value: "credit.adjustment" },
              { label: "Retry render", value: "render.retry" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "Aksi" },
          { label: "Admin" },
          { label: "Target" },
          { label: "Detail" },
          { label: "Waktu" },
        ]}
        isEmpty={logs.length === 0}
        empty="Tidak ada aktivitas admin yang cocok."
      >
        {logs.map((l) => (
          <tr key={l.id} className="hover:bg-muted/30">
            <td className="px-4 py-3 font-medium text-foreground">
              {ACTION_LABEL[l.action] ?? l.action}
            </td>
            <td className="px-4 py-3">{l.adminName}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {l.targetName ?? "-"}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
              {l.metadata ? JSON.stringify(l.metadata) : "-"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {dateFmt.format(l.createdAt)}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
