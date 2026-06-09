import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveProjectButton } from "@/components/app/archive-project-button";
import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { getProject } from "@/lib/projects/service";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { countRenders, listRenders } from "@/lib/renders/service";
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
  searchParams: Promise<{ page?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const project = await getProject(user.id, id);
  if (!project) notFound();

  const pageSize = 24;
  const page = Math.max(1, Number(pageParam) || 1);
  const [renders, total] = await Promise.all([
    listRenders(user.id, {
      projectId: id,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    countRenders(user.id, { projectId: id }),
  ]);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${total} render${project.isDefault ? " · Project default" : ""}`}
        action={
          <div className="flex gap-2">
            {!project.isDefault && <ArchiveProjectButton projectId={id} />}
            <Button asChild>
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
          title="Belum ada render di project ini"
          description="Mulai render pertama untuk project ini."
          action={
            <Button asChild>
              <Link href={`/renders/new?project=${id}`}>
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
