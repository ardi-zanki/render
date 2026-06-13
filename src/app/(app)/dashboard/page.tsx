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
import { getBalance } from "@/lib/credits";
import { getUnreadCount } from "@/lib/notifications/service";
import { STATUS_LABEL, statusBadgeVariant } from "@/lib/renders/labels";
import { paymentStatusBadge } from "@/lib/payments/labels";
import { listPayments } from "@/lib/payments/service";
import {
  countProjects,
  coverImagesByProject,
  listRecentProjects,
} from "@/lib/projects/service";
import { countUserRenders, listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });
const idr = new Intl.NumberFormat("id-ID");

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
    countUserRenders(uid),
    countUserRenders(uid, { status: "success" }),
    countProjects(uid),
    listRecentProjects(uid, 4),
    listRenders(uid, { limit: 6 }),
    getUnreadCount(uid),
    listPayments(uid, { limit: 1 }),
  ]);

  // Project covers track each project's latest render (derived, never stored).
  const projectCovers = await coverImagesByProject(
    uid,
    recentProjects.map((p) => p.id),
  );

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
      value: renderCount.toLocaleString("id-ID"),
      icon: ImageIcon,
    },
    {
      label: "Render Selesai",
      value: successCount.toLocaleString("id-ID"),
      icon: CheckCircle2,
    },
    {
      label: "Project",
      value: projectCount.toLocaleString("id-ID"),
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
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between">
                <div className="flex size-8 items-center justify-center rounded-md bg-accent text-primary">
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
                <p className="text-lg font-semibold tracking-normal text-foreground">
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
            <p className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4" /> Buat opsi visual berikutnya
            </p>
            <p className="text-sm leading-6 text-primary-foreground/80">
              Unggah desain, tentukan konteks, lalu simpan hasilnya langsung ke
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
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
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
              <Badge variant={paymentStatusBadge(latestPayment.status).variant}>
                {paymentStatusBadge(latestPayment.status).label}
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
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
          <h2 className="text-base font-semibold text-foreground">Render Terbaru</h2>
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
          <h2 className="text-base font-semibold text-foreground">Project</h2>
          <Link
            href="/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentProjects.map((p) => {
            const coverImageUrl = projectCovers.get(p.id) ?? null;
            return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="transition-colors hover:border-primary/35">
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {coverImageUrl ? (
                      <RenderImage
                        src={coverImageUrl}
                        alt={p.name}
                        className="absolute inset-0 size-full"
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
            );
          })}
        </div>
      </section>
    </>
  );
}
