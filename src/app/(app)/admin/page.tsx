import { ImageIcon, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { BarChart, BreakdownBars } from "@/components/app/charts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countDisabled,
  getAdminAnalytics,
  getAdminStats,
} from "@/lib/admin/service";
import { MODE_LABEL, STATUS_LABEL } from "@/lib/renders/labels";

export const metadata: Metadata = { title: "Admin · Ringkasan" };

const idr = new Intl.NumberFormat("id-ID");

export default async function AdminOverviewPage() {
  const [stats, disabled, analytics] = await Promise.all([
    getAdminStats(),
    countDisabled(),
    getAdminAnalytics(),
  ]);

  const cards = [
    {
      label: "Total User",
      value: idr.format(stats.users),
      icon: Users,
      hint: `${idr.format(stats.verifiedUsers)} verified · ${disabled} nonaktif`,
    },
    {
      label: "Total Render",
      value: idr.format(stats.renders),
      icon: ImageIcon,
      hint: `${idr.format(stats.rendersSuccess)} sukses · ${idr.format(stats.rendersFailed)} gagal`,
    },
    {
      label: "Pendapatan",
      value: `Rp${idr.format(stats.revenue)}`,
      icon: Wallet,
      hint: `${idr.format(stats.paidCount)} lunas · ${idr.format(stats.creditSold)} kredit`,
    },
  ];

  const renderBars = analytics.rendersByDay.map((d) => ({
    label: d.day.slice(8),
    value: d.value,
    title: `${d.day}: ${d.value} render`,
  }));
  const revenueBars = analytics.revenueByDay.map((d) => ({
    label: d.day.slice(8),
    value: d.value,
    title: `${d.day}: Rp${idr.format(d.value)}`,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex size-8 items-center justify-center rounded-md bg-accent text-primary">
                <c.icon className="size-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {c.value}
                </p>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm text-muted-foreground">
                AI provider error rate
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {stats.aiProviderErrorRate}%
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {idr.format(stats.rendersFailed)} gagal dari{" "}
                {idr.format(stats.renders)} render
              </p>
            </div>
            <Badge
              variant={
                stats.aiProviderErrorRate > 20
                  ? "destructive"
                  : stats.aiProviderErrorRate > 0
                    ? "warning"
                    : "success"
              }
            >
              {stats.aiProviderErrorRate > 20
                ? "Perlu cek"
                : stats.aiProviderErrorRate > 0
                  ? "Wajar"
                  : "Sehat"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment webhook</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {idr.format(stats.webhookReceived)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                webhook diterima · {idr.format(stats.pendingPayments)} pembayaran
                pending
              </p>
            </div>
            <Badge variant={stats.pendingPayments > 0 ? "warning" : "success"}>
              {stats.pendingPayments > 0 ? "Ada pending" : "Lancar"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Render · 14 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={renderBars} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan · 14 hari terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={revenueBars} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Render per Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              data={analytics.modeBreakdown.map((m) => ({
                label: MODE_LABEL[m.mode],
                value: m.value,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status Render</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownBars
              data={analytics.statusBreakdown.map((s) => ({
                label: STATUS_LABEL[s.status] ?? s.status,
                value: s.value,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
