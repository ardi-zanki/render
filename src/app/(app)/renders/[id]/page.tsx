import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Clock3,
  Coins,
  FileType,
  FolderOpen,
  Layers3,
  Sofa,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/app/page-header";
import { RenderActionsMenu } from "@/components/app/render-detail-actions";
import { RenderImage } from "@/components/app/render-image";
import { RenderProjectSelector } from "@/components/app/render-project-selector";
import { RenderVersions } from "@/components/app/render-versions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MODE_LABEL,
  STATUS_LABEL,
  renderResolvedDisplayName,
  statusBadgeVariant,
} from "@/lib/renders/labels";
import { listProjects } from "@/lib/projects/service";
import { getRenderDetail } from "@/lib/renders/queries";
import { renderVersionLabels } from "@/lib/renders/version-labels";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Detail Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function RenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { id } = await params;
  const [render, projectRows] = await Promise.all([
    getRenderDetail(user.id, id),
    listProjects(user.id),
  ]);
  if (!render) notFound();
  const renderName = renderResolvedDisplayName(render.name, render.mode);
  const projectOptions = projectRows.map((project) => ({
    id: project.id,
    name: project.name,
  }));
  // Versions in chronological order: first result, then each edit.
  const versionAssets = render.assets.filter(
    (a) => a.type === "result" || a.type === "edit",
  );
  const versions = renderVersionLabels(versionAssets).map(({ asset, label }) => ({
    id: asset.id,
    fileUrl: asset.fileUrl,
    label,
  }));

  return (
    <>
      <PageHeader
        title={renderName}
        action={
          <Button asChild variant="outline">
            <Link href="/renders">
              <ArrowLeft /> Kembali
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex flex-col gap-4">
          <RenderVersions
            originalUrl={render.originalUrl}
            versions={versions}
          />

          {render.referenceUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Reference Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md overflow-hidden rounded-lg border border-border bg-muted">
                  <RenderImage
                    src={render.referenceUrl}
                    alt="Reference"
                    className="aspect-video size-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="flex w-full flex-col gap-4 justify-self-stretch">
          <Card className="rounded-lg border-border/80 shadow-soft">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-primary">
                    <Layers3 className="size-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">
                    Info Render
                  </h2>
                  {render.config?.editKind === "texture" && (
                    <Badge variant="info">Edit Texture</Badge>
                  )}
                </div>
                <RenderActionsMenu
                  renderId={render.id}
                  renderName={renderName}
                  archived={!!render.archivedAt}
                  canDownload={render.status === "success" && !!render.resultUrl}
                />
              </div>

              <dl className="flex flex-col divide-y divide-border/70">
                <Info
                  icon={CircleCheck}
                  label="Status"
                  value={
                    <Badge variant={statusBadgeVariant(render.status)}>
                      {STATUS_LABEL[render.status] ?? render.status}
                    </Badge>
                  }
                />
                <Info
                  icon={CalendarDays}
                  label="Dibuat"
                  value={dateFmt.format(render.createdAt)}
                />
                <Info
                  icon={Clock3}
                  label="Diperbarui"
                  value={dateFmt.format(render.updatedAt)}
                />
                <Info
                  icon={Sofa}
                  label="Mode"
                  value={MODE_LABEL[render.mode]}
                />
                <Info
                  icon={FolderOpen}
                  label="Project"
                  value={
                    <RenderProjectSelector
                      renderId={render.id}
                      currentProjectId={render.projectId}
                      currentProjectName={render.projectName}
                      projects={projectOptions}
                    />
                  }
                />
                <Info
                  icon={FileType}
                  label="Format"
                  value={render.outputFormat.toUpperCase()}
                />
                <Info
                  icon={Coins}
                  label="Kredit"
                  value={`${render.creditsUsed || 1} kredit`}
                />
              </dl>

              {render.errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {render.errorMessage}
                </div>
              )}
              <Button asChild size="sm" className="mt-1 w-full">
                <Link href={`/renders/new?source=${render.id}`}>
                  <Wand2 /> Open Studio
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
