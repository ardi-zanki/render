import type { Metadata } from "next";

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
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [logs, total] = await Promise.all([
    listAuditLogs(pageSize, (page - 1) * pageSize),
    countAuditLogs(),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminTable
        headers={[
          { label: "Aksi" },
          { label: "Admin" },
          { label: "Target" },
          { label: "Detail" },
          { label: "Waktu" },
        ]}
        isEmpty={logs.length === 0}
        empty="Belum ada aktivitas admin."
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
