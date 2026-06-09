import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
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

type ProjectStatusFilter = "active" | "archived" | "deleted" | "default";

function parseStatus(value?: string): ProjectStatusFilter | undefined {
  if (
    value === "active" ||
    value === "archived" ||
    value === "deleted" ||
    value === "default"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, status } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    status: parseStatus(status),
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllProjects(pageSize, (page - 1) * pageSize, filters),
    countAllProjects(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari nama project atau user"
        resetHref="/admin/projects"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: "Aktif", value: "active" },
              { label: "Arsip", value: "archived" },
              { label: "Dihapus", value: "deleted" },
              { label: "Default", value: "default" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "Project" },
          { label: "User" },
          { label: "Status" },
          { label: "Diperbarui" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada project yang cocok."
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
                <Badge variant="destructive">Dihapus</Badge>
              ) : p.archivedAt ? (
                <Badge variant="secondary">Arsip</Badge>
              ) : (
                <Badge variant="success">Aktif</Badge>
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
