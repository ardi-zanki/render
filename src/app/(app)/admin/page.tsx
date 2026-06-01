import { ImageIcon, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { countDisabled, getAdminStats } from "@/lib/admin/service";

export const metadata: Metadata = { title: "Admin · Ringkasan" };

const idr = new Intl.NumberFormat("id-ID");

export default async function AdminOverviewPage() {
  const [stats, disabled] = await Promise.all([
    getAdminStats(),
    countDisabled(),
  ]);

  const cards = [
    {
      label: "Total User",
      value: idr.format(stats.users),
      icon: Users,
      hint: `${disabled} nonaktif`,
    },
    {
      label: "Total Render",
      value: idr.format(stats.renders),
      icon: ImageIcon,
      hint: `${idr.format(stats.rendersSuccess)} sukses`,
    },
    {
      label: "Pendapatan",
      value: `Rp${idr.format(stats.revenue)}`,
      icon: Wallet,
      hint: `${idr.format(stats.paidCount)} transaksi lunas`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="flex flex-col gap-3 py-5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <c.icon className="size-4" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">
                {c.value}
              </p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
