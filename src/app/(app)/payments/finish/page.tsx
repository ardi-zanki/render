import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RefreshOnMount } from "@/components/app/refresh-on-mount";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPaymentForUser } from "@/lib/payments/service";
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
    title: "Menunggu konfirmasi",
    desc: "Pembayaran sedang menunggu konfirmasi dari Midtrans. Kredit akan ditambahkan otomatis setelah transaksi lunas.",
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
  searchParams: Promise<{ status?: string; order?: string; order_id?: string }>;
}) {
  const { status, order, order_id: orderIdParam } = await searchParams;
  const { user } = await requireVerifiedUser();
  const orderId = order ?? orderIdParam;
  const payment = orderId ? await getPaymentForUser(user.id, orderId) : null;

  const key = payment
    ? payment.status === "paid"
      ? "success"
      : payment.status === "pending"
        ? "pending"
        : "failed"
    : status === "success" || status === "pending"
      ? status
      : "failed";
  const v = VARIANTS[key];
  const Icon = v.icon;

  return (
    <div className="mx-auto flex w-full max-w-lg justify-center">
      {key === "success" && <RefreshOnMount />}
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
