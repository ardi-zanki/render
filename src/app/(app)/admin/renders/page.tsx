import type { Metadata } from "next";
import Link from "next/link";

import { AdminTable } from "@/components/app/admin-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RenderMode, RenderStatus } from "@/db/schema";
import { listAllRenders } from "@/lib/admin/service";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { requireAdmin } from "@/lib/session";

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
  searchParams: Promise<{ status?: string; mode?: string }>;
}) {
  await requireAdmin();
  const { status, mode } = await searchParams;
  const rows = await listAllRenders(100, {
    status: parseStatus(status),
    mode: parseMode(mode),
  });

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
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
