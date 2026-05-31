import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Gem,
  ImageIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/db";
import { projects, renders } from "@/db/schema";
import { getBalance } from "@/lib/credits";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function DashboardPage() {
  const session = await requireVerifiedUser();
  const uid = session.user.id;

  const [balance, renderCount, successCount, projectCount, recentProjects] =
    await Promise.all([
      getBalance(uid),
      db
        .select({ value: count() })
        .from(renders)
        .where(and(eq(renders.userId, uid), isNull(renders.deletedAt))),
      db
        .select({ value: count() })
        .from(renders)
        .where(
          and(
            eq(renders.userId, uid),
            eq(renders.status, "success"),
            isNull(renders.deletedAt),
          ),
        ),
      db
        .select({ value: count() })
        .from(projects)
        .where(and(eq(projects.userId, uid), isNull(projects.deletedAt))),
      db.query.projects.findMany({
        where: and(
          eq(projects.userId, uid),
          isNull(projects.deletedAt),
          isNull(projects.archivedAt),
        ),
        orderBy: desc(projects.updatedAt),
        limit: 4,
      }),
    ]);

  const firstName = session.user.name.split(" ")[0];

  const stats = [
    {
      label: "Sisa Kredit",
      value: balance.toLocaleString("id-ID"),
      icon: Gem,
      href: "/payments",
      hint: "Top up",
    },
    {
      label: "Total Render",
      value: renderCount[0].value.toLocaleString("id-ID"),
      icon: ImageIcon,
    },
    {
      label: "Render Selesai",
      value: successCount[0].value.toLocaleString("id-ID"),
      icon: CheckCircle2,
    },
    {
      label: "Project",
      value: projectCount[0].value.toLocaleString("id-ID"),
      icon: FolderOpen,
      href: "/projects",
      hint: "Kelola",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName} 👋`}
        description="Siap bikin visual arsitektur baru hari ini?"
        action={
          <Button asChild>
            <Link href="/renders/new">
              <Plus /> Buat Render
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-3 py-5">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-4" />
                </div>
                {s.href && (
                  <Link
                    href={s.href}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {s.hint}
                  </Link>
                )}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA banner */}
      <Card className="mt-6 overflow-hidden border-0 bg-primary text-primary-foreground">
        <CardContent className="flex flex-col items-start gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-lg font-extrabold">
              <Sparkles className="size-5" /> Siapin kopi, yok kita ngrender
            </p>
            <p className="text-sm text-primary-foreground/80">
              Upload desain, pilih mode, dan dapatkan render realistis dalam
              hitungan detik.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/renders/new">
              Mulai Render <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent renders */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Render Terbaru</h2>
          <Link
            href="/renders"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <EmptyState
          icon={ImageIcon}
          title="Belum ada render"
          description="Render pertamamu akan muncul di sini. Yuk mulai sekarang."
          action={
            <Button asChild>
              <Link href="/renders/new">
                <Plus /> Buat Render
              </Link>
            </Button>
          }
        />
      </section>

      {/* Projects */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Project</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentProjects.map((p) => (
            <Card key={p.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 py-5">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FolderOpen className="size-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="truncate font-semibold text-foreground">
                    {p.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diperbarui {dateFmt.format(p.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
