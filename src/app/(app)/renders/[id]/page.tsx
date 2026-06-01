import { ArrowLeft, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/app/page-header";
import { RenderDetailActions } from "@/components/app/render-detail-actions";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MODE_LABEL,
  STATUS_LABEL,
  statusBadgeVariant,
} from "@/lib/renders/labels";
import { getRenderDetail } from "@/lib/renders/service";
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
  const render = await getRenderDetail(user.id, id);
  if (!render) notFound();

  return (
    <>
      <PageHeader
        title={`Render ${MODE_LABEL[render.mode]}`}
        description={`${render.projectName} · ${dateFmt.format(render.createdAt)}`}
        action={
          <Button asChild variant="outline">
            <Link href="/renders">
              <ArrowLeft /> Kembali
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <ImagePanel title="Gambar asli" src={render.originalUrl} />
              <ImagePanel title="Hasil render" src={render.resultUrl} />
            </div>
          </Card>

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

        <aside className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant(render.status)}>
                  {STATUS_LABEL[render.status] ?? render.status}
                </Badge>
              </div>
              <Info label="Mode" value={MODE_LABEL[render.mode]} />
              <Info label="Project" value={render.projectName} />
              <Info label="Format" value={render.outputFormat.toUpperCase()} />
              <Info label="Kredit" value={`${render.creditsUsed || 1} kredit`} />
              {render.errorMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {render.errorMessage}
                </div>
              )}
              <RenderDetailActions
                renderId={render.id}
                projectId={render.projectId}
                prompt={render.prompt}
                archived={!!render.archivedAt}
                canDownload={render.status === "success" && !!render.resultUrl}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {render.prompt || "Tidak ada prompt."}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ImagePanel({ title, src }: { title: string; src: string | null }) {
  return (
    <figure className="border-b border-border bg-muted md:border-b-0 md:border-r md:last:border-r-0">
      <figcaption className="border-b border-border bg-card px-4 py-2 text-sm font-semibold">
        {title}
      </figcaption>
      <div className="flex aspect-square items-center justify-center">
        {src ? (
          <RenderImage src={src} alt={title} className="size-full" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-sm">Belum tersedia</span>
          </div>
        )}
      </div>
    </figure>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
