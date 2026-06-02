import type { Metadata } from "next";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { countAllProjects, listAllProjects } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Project" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam } = await searchParams;
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllProjects(pageSize, (page - 1) * pageSize),
    countAllProjects(),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminTable
      headers={[
        { label: "Project" },
        { label: "User" },
        { label: "Status" },
        { label: "Diperbarui" },
      ]}
      isEmpty={rows.length === 0}
      empty="Belum ada project."
    >
      {rows.map((p) => (
        <tr key={p.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium text-foreground">
            {p.name}
            {p.isDefault && (
              <Badge variant="secondary" className="ml-2">
                Default
              </Badge>
            )}
          </td>
          <td className="px-4 py-3">{p.userName}</td>
          <td className="px-4 py-3">
            {p.deletedAt ? (
              <Badge variant="destructive">Deleted</Badge>
            ) : p.archivedAt ? (
              <Badge variant="secondary">Archived</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            {dateFmt.format(p.updatedAt)}
          </td>
        </tr>
      ))}
    </AdminTable>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
