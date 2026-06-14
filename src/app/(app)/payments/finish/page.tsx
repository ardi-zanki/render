import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBalance } from "@/lib/credits";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Status Pembayaran" };

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    color: "text-success",
    title: "Pembayaran berhasil",
    desc: "Kredit sudah ditambahkan ke akun Anda dan siap digunakan.",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    title: "Pembayaran Diproses",
    desc: "Pembayaran Anda sedang menunggu konfirmasi. Kredit ditambahkan setelah lunas.",
  },
  failed: {
    icon: XCircle,
    color: "text-destructive",
    title: "Pembayaran Gagal",
    desc: "Pembayaran dibatalkan atau gagal. Tidak ada kredit yang ditambahkan.",
  },
} as const;

export default async function PaymentFinishPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { user } = await requireVerifiedUser();
  const balance = await getBalance(user.id);

  const key = (
    status === "success" || status === "pending" ? status : "failed"
  ) as keyof typeof VARIANTS;
  const v = VARIANTS[key];
  const Icon = v.icon;

  return (
    <div className="mx-auto flex w-full max-w-lg justify-center">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-5 px-5 py-8 text-center sm:px-8 sm:py-10">
          <Icon className={`size-14 sm:size-16 ${v.color}`} />
          <div className="flex max-w-sm flex-col gap-1.5">
            <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
              {v.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {v.desc}
            </p>
          </div>
          <div className="rounded-md bg-muted px-4 py-2 text-sm sm:text-base">
            Sisa kredit:{" "}
            <span className="font-semibold text-foreground">
              {balance.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-1 grid w-full gap-2 sm:grid-cols-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/renders/new">Mulai render</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/payments">Riwayat transaksi</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
