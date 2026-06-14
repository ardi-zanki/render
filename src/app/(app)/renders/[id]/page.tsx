import { ArrowLeft, Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getRenderDetail } from "@/lib/renders/service";
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
          <Card>
            <CardContent className="flex flex-col gap-2.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
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
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant(render.status)}>
                  {STATUS_LABEL[render.status] ?? render.status}
                </Badge>
              </div>
              <Info label="Dibuat" value={dateFmt.format(render.createdAt)} />
              <Info label="Mode" value={MODE_LABEL[render.mode]} />
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Project</span>
                <RenderProjectSelector
                  renderId={render.id}
                  currentProjectId={render.projectId}
                  currentProjectName={render.projectName}
                  projects={projectOptions}
                />
              </div>
              <Info label="Format" value={render.outputFormat.toUpperCase()} />
              <Info label="Kredit" value={`${render.creditsUsed || 1} kredit`} />
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
