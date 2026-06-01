import { and, count, eq, isNull } from "drizzle-orm";
import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/db";
import { renders } from "@/db/schema";
import { listProjects } from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";
import { createProjectAction } from "./actions";

export const metadata: Metadata = { title: "Project" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function ProjectsPage() {
  const { user } = await requireVerifiedUser();
  const [projects, counts] = await Promise.all([
    listProjects(user.id),
    db
      .select({ projectId: renders.projectId, value: count() })
      .from(renders)
      .where(and(eq(renders.userId, user.id), isNull(renders.deletedAt)))
      .groupBy(renders.projectId),
  ]);
  const countMap = new Map(counts.map((c) => [c.projectId, c.value]));

  return (
    <>
      <PageHeader
        title="Project"
        description="Kelompokkan render Anda per project."
      />

      <form
        action={createProjectAction}
        className="mb-6 flex max-w-md gap-2"
      >
        <Input name="name" placeholder="Nama project baru…" maxLength={80} required />
        <Button type="submit" className="shrink-0">
          Buat
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
              <div className="flex aspect-video items-center justify-center bg-muted">
                {p.coverImageUrl ? (
                  <RenderImage
                    src={p.coverImageUrl}
                    alt={p.name}
                    className="size-full"
                  />
                ) : (
                  <FolderOpen className="size-7 text-muted-foreground" />
                )}
              </div>
              <CardContent className="flex items-start justify-between gap-2 py-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="flex items-center gap-2 truncate font-semibold text-foreground">
                    {p.name}
                    {p.isDefault && <Badge variant="secondary">Default</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {countMap.get(p.id) ?? 0} render ·{" "}
                    {dateFmt.format(p.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
