import { ImageIcon, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import type { RenderStatus } from "@/db/schema";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { countRenders, listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Riwayat Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const FILTERS: { label: string; archived?: string; status?: string }[] = [
  { label: "Aktif" },
  { label: "Arsip", archived: "1" },
  { label: "Diproses", status: "processing" },
  { label: "Gagal", status: "failed" },
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
  searchParams: Promise<{
    archived?: string;
    status?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const { user } = await requireVerifiedUser();
  const { archived, status, page: pageParam, q: queryParam } = await searchParams;
  const showArchived = archived === "1";
  const statusFilter = renderStatus(status);
  const query = queryParam?.trim() ?? "";
  const pageSize = 24;
  const page = Math.max(1, Number(pageParam) || 1);
  const [renders, total] = await Promise.all([
    listRenders(user.id, {
      limit: pageSize,
      offset: (page - 1) * pageSize,
      archived: showArchived,
      status: statusFilter,
      search: query,
    }),
    countRenders(user.id, {
      archived: showArchived,
      status: statusFilter,
      search: query,
    }),
  ]);
  const totalPages = Math.ceil(total / pageSize);
  const filterHref = (filter: (typeof FILTERS)[number]) => {
    const params = new URLSearchParams();
    if (filter.archived) params.set("archived", filter.archived);
    if (filter.status) params.set("status", filter.status);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `/renders?${qs}` : "/renders";
  };

  return (
    <>
      <PageHeader
        title="Riwayat render"
        description="Semua render Anda, lengkap dengan status, mode, dan waktu pembuatan."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          className="inline-flex flex-wrap items-center gap-1 rounded-md bg-muted/80 p-1"
        >
        {FILTERS.map((f) => {
          const active =
            (!f.archived && !f.status && !showArchived && !status) ||
            (f.archived === "1" && showArchived) ||
            (!!f.status && f.status === status);

          return (
            <Link
              key={f.label}
              href={filterHref(f)}
              role="tab"
              aria-selected={active}
              className={cn(
                "rounded-sm px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
        </div>
        <div className="flex min-w-0 gap-2">
          <form action="/renders" className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
            {showArchived && <input type="hidden" name="archived" value="1" />}
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Cari render..."
              className="pl-9"
            />
          </form>
          <Button asChild className="shrink-0">
            <Link href="/renders/new">
              <Plus /> Buat render
            </Link>
          </Button>
        </div>
      </div>

      {renders.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={query ? "Render tidak ditemukan" : "Belum ada render"}
          description={
            query ? "Coba kata kunci lain." : "Render pertama Anda akan muncul di sini."
          }
          action={
            query ? undefined : (
              <Link
                href="/renders/new"
                className="text-sm font-normal text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                Buat render
              </Link>
            )
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
                        className="absolute inset-0 size-full"
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
                  <CardContent className="py-3.5">
                    <p className="truncate font-semibold text-foreground">
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
