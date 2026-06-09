import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";

import { AdminDataToolbar } from "@/components/app/admin-data-toolbar";
import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import type { RenderMode, RenderStatus } from "@/db/schema";
import { countAllRenders, listAllRenders } from "@/lib/admin/service";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { requireAdmin } from "@/lib/session";
import { retryRenderAction } from "./actions";

export const metadata: Metadata = { title: "Admin · Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function parseMode(value?: string): RenderMode | undefined {
  if (
    value === "interior" ||
    value === "exterior" ||
    value === "style_transfer" ||
    value === "upscale"
  ) {
    return value;
  }
  return undefined;
}

function parseStatus(value?: string): RenderStatus | undefined {
  if (
    value === "queued" ||
    value === "processing" ||
    value === "success" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  ) {
    return value;
  }
  return undefined;
}

export default async function AdminRendersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    mode?: string;
  }>;
}) {
  await requireAdmin();
  const { page: pageParam, q, status, mode } = await searchParams;
  const filters = {
    q: q?.trim() || undefined,
    status: parseStatus(status),
    mode: parseMode(mode),
  };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllRenders(pageSize, filters, (page - 1) * pageSize),
    countAllRenders(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <AdminDataToolbar
        search={filters.q}
        searchPlaceholder="Cari user, provider, request id, atau error"
        resetHref="/admin/renders"
        filters={[
          {
            name: "status",
            label: "Status",
            value: filters.status,
            options: [
              { label: "Semua status", value: "" },
              { label: STATUS_LABEL.queued ?? "Queued", value: "queued" },
              { label: STATUS_LABEL.processing ?? "Processing", value: "processing" },
              { label: STATUS_LABEL.success ?? "Success", value: "success" },
              { label: STATUS_LABEL.failed ?? "Failed", value: "failed" },
              { label: STATUS_LABEL.cancelled ?? "Cancelled", value: "cancelled" },
              { label: STATUS_LABEL.refunded ?? "Refunded", value: "refunded" },
            ],
          },
          {
            name: "mode",
            label: "Mode",
            value: filters.mode,
            options: [
              { label: "Semua mode", value: "" },
              { label: MODE_LABEL.interior, value: "interior" },
              { label: MODE_LABEL.exterior, value: "exterior" },
              { label: MODE_LABEL.style_transfer, value: "style_transfer" },
              { label: MODE_LABEL.upscale, value: "upscale" },
            ],
          },
        ]}
      />

      <AdminTable
        headers={[
          { label: "User" },
          { label: "Mode" },
          { label: "Status" },
          { label: "Provider" },
          { label: "Error" },
          { label: "Waktu" },
          { label: "Aksi", align: "right" },
        ]}
        isEmpty={rows.length === 0}
        empty="Tidak ada render yang cocok."
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
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
              {r.aiProvider ?? "-"}
            </td>
            <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
              {r.errorMessage ?? r.providerRequestId ?? "-"}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {dateFmt.format(r.createdAt)}
            </td>
            <td className="px-4 py-3 text-right">
              {r.status === "failed" ? (
                <form action={retryRenderAction} className="inline-flex">
                  <input type="hidden" name="renderId" value={r.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <RotateCcw /> Retry
                  </Button>
                </form>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
