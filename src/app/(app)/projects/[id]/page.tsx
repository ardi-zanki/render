import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArchiveProjectButton } from "@/components/app/archive-project-button";
import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getProject } from "@/lib/projects/service";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Project" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { id } = await params;

  const project = await getProject(user.id, id);
  if (!project) notFound();

  const renders = await listRenders(user.id, { projectId: id, limit: 100 });

  return (
    <>
      <PageHeader
        title={project.name}
        description={`${renders.length} render${project.isDefault ? " · Project default" : ""}`}
        action={
          <div className="flex gap-2">
            {!project.isDefault && <ArchiveProjectButton projectId={id} />}
            <Button asChild>
              <Link href={`/renders/new?project=${id}`}>
                <Plus /> Buat Render
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

      {renders.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Belum ada render di project ini"
          description="Mulai render pertama untuk project ini."
          action={
            <Button asChild>
              <Link href={`/renders/new?project=${id}`}>
                <Plus /> Buat Render
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {renders.map((r) => {
            const thumb = r.resultUrl ?? r.originalUrl;
            return (
              <Card key={r.id} className="gap-0 overflow-hidden p-0">
                <div className="relative flex aspect-square items-center justify-center bg-muted">
                  {thumb ? (
                    <RenderImage src={thumb} alt={r.mode} className="size-full" />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                  <Badge
                    variant={statusBadgeVariant(r.status)}
                    className="absolute left-2 top-2"
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {MODE_LABEL[r.mode]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dateFmt.format(r.createdAt)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
