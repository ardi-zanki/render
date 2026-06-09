import { Archive, ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import type { RenderStatus } from "@/db/schema";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { countRenders, listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Riwayat Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const FILTERS: { label: string; href: string }[] = [
  { label: "Aktif", href: "/renders" },
  { label: "Arsip", href: "/renders?archived=1" },
  { label: "Diproses", href: "/renders?status=processing" },
  { label: "Gagal", href: "/renders?status=failed" },
];

function renderStatus(value?: string): RenderStatus | undefined {
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

export default async function RendersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; status?: string; page?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { archived, status, page: pageParam } = await searchParams;
  const showArchived = archived === "1";
  const statusFilter = renderStatus(status);
  const pageSize = 24;
  const page = Math.max(1, Number(pageParam) || 1);
  const [renders, total] = await Promise.all([
    listRenders(user.id, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      archived: showArchived,
      status: statusFilter,
    }),
    countRenders(user.id, { archived: showArchived, status: statusFilter }),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title="Riwayat render"
        description="Semua render Anda, lengkap dengan status, mode, dan waktu pembuatan."
        action={
          <Button asChild>
            <Link href="/renders/new">
              <Plus /> Buat render
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.href}
            asChild
            variant={
              (f.href === "/renders" && !showArchived && !status) ||
              (f.href.includes("archived") && showArchived) ||
              (status && f.href.includes(status))
                ? "default"
                : "outline"
            }
            size="sm"
          >
            <Link href={f.href}>
              {f.href.includes("archived") && <Archive />}
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      {renders.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Belum ada render"
          description="Render pertama Anda akan muncul di sini."
          action={
            <Button asChild>
              <Link href="/renders/new">
                <Plus /> Buat render
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {renders.map((r) => {
            const thumb = r.resultUrl ?? r.originalUrl;
            return (
              <Link key={r.id} href={`/renders/${r.id}`}>
                <Card className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary/35">
                  <div className="relative flex aspect-video items-center justify-center bg-muted">
                    {thumb ? (
                      <RenderImage
                        src={thumb}
                        alt={r.mode}
                        className="size-full"
                      />
                    ) : (
                      <ImageIcon className="size-7 text-muted-foreground" />
                    )}
                    <Badge
                      variant={statusBadgeVariant(r.status)}
                      className="absolute left-2 top-2"
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </div>
                  <CardContent className="py-4">
                    <p className="font-semibold text-foreground">
                      {MODE_LABEL[r.mode]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.projectName ? `${r.projectName} · ` : ""}
                      {dateFmt.format(r.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}
