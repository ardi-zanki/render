import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  FolderOpen,
  Gem,
  ImageIcon,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { RenderImage } from "@/components/app/render-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/db";
import { projects, renders } from "@/db/schema";
import { getBalance } from "@/lib/credits";
import {
  STATUS_LABEL,
  statusBadgeVariant,
  type BadgeVariant,
} from "@/lib/renders/labels";
import { getUnreadCount } from "@/lib/notifications/service";
import { listPayments } from "@/lib/payments/service";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const idr = new Intl.NumberFormat("id-ID");

const PAY_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  paid: { label: "Lunas", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  failed: { label: "Gagal", variant: "destructive" },
  expired: { label: "Kedaluwarsa", variant: "secondary" },
  cancelled: { label: "Batal", variant: "secondary" },
  refunded: { label: "Refund", variant: "info" },
};

export default async function DashboardPage() {
  const session = await requireVerifiedUser();
  const uid = session.user.id;

  const [
    balance,
    renderCount,
    successCount,
    projectCount,
    recentProjects,
    recentRenders,
    unreadCount,
    latestPaymentRows,
  ] = await Promise.all([
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
      listRenders(uid, { limit: 6 }),
      getUnreadCount(uid),
      listPayments(uid, { limit: 1 }),
    ]);

  const latestPayment = latestPaymentRows[0] ?? null;
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
        title={`Halo, ${firstName}`}
        description="Pantau kredit, project aktif, dan visual terbaru dalam satu workspace."
        action={
          <Button asChild>
            <Link href="/renders/new">
              <Plus /> Buat render
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="transition-colors hover:border-primary/25">
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
                <p className="text-2xl font-semibold tracking-normal text-foreground">
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA banner */}
      <Card className="mt-5 overflow-hidden border-0 bg-primary text-primary-foreground shadow-soft">
        <CardContent className="flex flex-col items-start gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-base font-semibold sm:text-lg">
              <Sparkles className="size-5" /> Buat opsi visual berikutnya
            </p>
            <p className="text-sm leading-6 text-primary-foreground/80">
              Upload desain, tentukan konteks, lalu simpan hasilnya langsung ke
              project yang sesuai.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link href="/renders/new">
              Mulai render <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Status: latest payment + notifications */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Pembayaran terakhir
                </p>
                {latestPayment ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {latestPayment.packageName} · Rp
                    {idr.format(latestPayment.amount)} ·{" "}
                    {dateFmt.format(latestPayment.createdAt)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Belum ada transaksi
                  </p>
                )}
              </div>
            </div>
            {latestPayment ? (
              <Badge
                variant={PAY_STATUS[latestPayment.status]?.variant ?? "secondary"}
              >
                {PAY_STATUS[latestPayment.status]?.label ?? latestPayment.status}
              </Badge>
            ) : (
              <Link
                href="/payments"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Top up
              </Link>
            )}
          </CardContent>
        </Card>

        <Link href="/notifications">
          <Card className="transition-colors hover:border-primary/25">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Notifikasi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {unreadCount > 0
                      ? `${unreadCount} belum dibaca`
                      : "Semua sudah dibaca"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge>{unreadCount > 9 ? "9+" : unreadCount}</Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent renders */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Render Terbaru</h2>
          <Link
            href="/renders"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {recentRenders.length === 0 ? (
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recentRenders.map((r) => {
              const thumb = r.resultUrl ?? r.originalUrl;
              return (
                <div
                  key={r.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {thumb && (
                    <RenderImage src={thumb} alt={r.mode} className="size-full" />
                  )}
                  <Badge
                    variant={statusBadgeVariant(r.status)}
                    className="absolute left-1.5 top-1.5"
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Projects */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Project</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentProjects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="transition-colors hover:border-primary/35">
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {p.coverImageUrl ? (
                      <RenderImage
                        src={p.coverImageUrl}
                        alt={p.name}
                        className="size-full"
                      />
                    ) : (
                      <FolderOpen className="size-6" />
                    )}
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
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
