import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DebouncedSearchInput } from "@/components/app/debounced-search-input";
import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { RenderStatusBadge } from "@/components/app/render-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getProject } from "@/lib/projects/service";
import { MODE_LABEL } from "@/lib/renders/labels";
import { countRenders, listRenders } from "@/lib/renders/queries";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Project" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { id } = await params;
  const { page: pageParam, q: queryParam } = await searchParams;
  const query = queryParam?.trim() ?? "";

  const project = await getProject(user.id, id);
  if (!project) notFound();

  const pageSize = 24;
  const page = Math.max(1, Number(pageParam) || 1);
  const [renders, total] = await Promise.all([
    listRenders(user.id, {
      projectId: id,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      search: query,
    }),
    countRenders(user.id, { projectId: id, search: query }),
  ]);
  const totalPages = Math.ceil(total / pageSize);
  const returnParams = new URLSearchParams();
  if (page > 1) returnParams.set("page", String(page));
  if (query) returnParams.set("q", query);
  const returnQuery = returnParams.toString();
  const returnTo = `/projects/${id}${returnQuery ? `?${returnQuery}` : ""}`;

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${total} render${project.isDefault ? " · Project default" : ""}`}
        backLink={{ href: "/projects", label: "Semua project" }}
        action={
          <div className="flex w-full min-w-0 flex-row gap-2 sm:w-auto">
            <DebouncedSearchInput value={query} placeholder="Cari render..." />
            <Button asChild className="shrink-0">
              <Link href={`/renders/new?project=${id}`}>
                <Plus /> Buat render
              </Link>
            </Button>
          </div>
        }
      />

      {project.description && (
        <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      {total === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={query ? "Render tidak ditemukan" : "Belum ada render di project ini"}
          description={
            query
              ? "Coba kata kunci lain."
              : "Mulai render pertama untuk project ini."
          }
          action={
            query ? undefined : (
              <Link
                href={`/renders/new?project=${id}`}
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
            const displayName = r.name?.trim() || MODE_LABEL[r.mode];
            return (
              <Link
                key={r.id}
                href={{ pathname: `/renders/${r.id}`, query: { returnTo } }}
              >
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
                    <RenderStatusBadge status={r.status} className="absolute left-2 top-2" />
                  </div>
                  <CardContent className="py-3.5">
                    <p className="truncate font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {MODE_LABEL[r.mode]} · {dateFmt.format(r.createdAt)}
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
