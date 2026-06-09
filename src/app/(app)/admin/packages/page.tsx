import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { countPaymentPackages, listPaymentPackages } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Payment Packages" };

const idr = new Intl.NumberFormat("id-ID");

function parseStatus(value?: string): "active" | "inactive" | undefined {
  if (value === "active" || value === "inactive") return value;
  return undefined;
}

export default async function AdminPackagesPage({
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
    listPaymentPackages(pageSize, (page - 1) * pageSize, filters),
    countPaymentPackages(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari nama paket atau slug"
        resetHref="/admin/packages"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: "Aktif", value: "active" },
              { label: "Nonaktif", value: "inactive" },
            ],
          },
        ]}
      />
      <AdminTable
        headers={[
          { label: "Paket" },
          { label: "Slug" },
          { label: "Harga", align: "right" },
          { label: "Kredit", align: "right" },
          { label: "Status" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada paket yang cocok."
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
                <Badge variant="success">Aktif</Badge>
              ) : (
                <Badge variant="secondary">Nonaktif</Badge>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
