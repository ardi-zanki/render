import { ImageIcon, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MODE_LABEL, STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Riwayat Render" };

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function RendersPage() {
  const { user } = await requireVerifiedUser();
  const renders = await listRenders(user.id, { limit: 60 });

  return (
    <>
      <PageHeader
        title="Riwayat Render"
        description="Semua render Anda, lengkap dengan status, mode, dan waktu pembuatan."
        action={
          <Button asChild>
            <Link href="/renders/new">
              <Plus /> Buat render
            </Link>
          </Button>
        }
      />

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
