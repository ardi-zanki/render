import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

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
  searchParams: Promise<{ status?: string; mode?: string; page?: string }>;
}) {
  await requireAdmin();
  const { status, mode, page: pageParam } = await searchParams;
  const filters = { status: parseStatus(status), mode: parseMode(mode) };
  const pageSize = 20;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listAllRenders(pageSize, filters, (page - 1) * pageSize),
    countAllRenders(filters),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {["failed", "processing", "success"].map((s) => (
          <Button key={s} asChild size="sm" variant={status === s ? "default" : "outline"}>
            <Link href={`/admin/renders?status=${s}`}>
              {STATUS_LABEL[s] ?? s}
            </Link>
          </Button>
        ))}
        <Button asChild size="sm" variant={!status && !mode ? "default" : "outline"}>
          <Link href="/admin/renders">Semua</Link>
        </Button>
      </div>

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
