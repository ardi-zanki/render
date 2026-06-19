import { Check, Gem } from "lucide-react";
import type { Metadata } from "next";
import Script from "next/script";

import { BuyButton, ResumePaymentButton } from "@/components/app/buy-button";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { env } from "@/env";
import { getBalance } from "@/lib/credits";
import {
  countPayments,
  listActivePaymentPackages,
  listPayments,
} from "@/lib/payments/service";
import { paymentStatusBadge } from "@/lib/payments/labels";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pembayaran" };

const idr = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { page: pageParam } = await searchParams;
  const pageSize = 10;
  const page = Math.max(1, Number(pageParam) || 1);
  const [packages, balance, history, historyTotal] = await Promise.all([
    listActivePaymentPackages(),
    getBalance(user.id),
    listPayments(user.id, { limit: pageSize, offset: (page - 1) * pageSize }),
    countPayments(user.id),
  ]);
  const totalPages = Math.ceil(historyTotal / pageSize);

  const snapEnabled =
    env.PAYMENT_PROVIDER === "midtrans" && !!env.MIDTRANS_CLIENT_KEY;
  const snapUrl = env.MIDTRANS_IS_PRODUCTION
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <>
      {snapEnabled && (
        <Script
          src={snapUrl}
          data-client-key={env.MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      )}

      <PageHeader
        title="Top up"
        description={`Sisa kredit: ${idr.format(balance)}. Setiap render memakai 1 kredit.`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const featured = pkg.slug === "creator";
          const total = pkg.credits + pkg.bonusCredits;
          const perCredit = Math.round(pkg.price / total);
          return (
            <Card
              key={pkg.id}
              className={featured ? "border-primary/70 ring-1 ring-primary/15" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{pkg.name}</CardTitle>
                  {featured && <Badge>Populer</Badge>}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Gem className="size-4 text-primary" />
                  {idr.format(total)} kredit
                  {pkg.bonusCredits > 0 && (
                    <span className="text-success">+{pkg.bonusCredits} bonus</span>
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Rp
                  </span>
                  <span className="text-lg font-semibold tracking-normal text-foreground">
                    {idr.format(pkg.price)}
                  </span>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="size-3 text-success" /> ≈ Rp
                  {idr.format(perCredit)} / render
                </p>
              </CardContent>
              <CardFooter>
                <BuyButton slug={pkg.slug} featured={featured} />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <section className="mt-7">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Riwayat transaksi
        </h2>
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada transaksi.
          </p>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="divide-y divide-border">
              {history.map((p) => {
                const s = paymentStatusBadge(p.status);
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-4 py-3.5 transition-colors hover:bg-muted/35 sm:px-5"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {p.packageName} · {idr.format(p.credits)} kredit
                      </span>
                    </div>
                    <Badge variant={s.variant} className="self-start justify-self-end">
                      {s.label}
                    </Badge>
                    <div className="min-w-0 font-mono text-xs leading-5 text-muted-foreground">
                      <span className="block truncate">{p.orderId}</span>
                    </div>
                    <span className="self-start justify-self-end text-sm font-semibold tabular-nums text-foreground sm:text-base">
                      Rp{idr.format(p.amount)}
                    </span>
                    <div className="col-start-1 min-w-0 font-mono text-xs leading-5 text-muted-foreground">
                      {dateFmt.format(p.createdAt)}
                    </div>
                    {p.status === "pending" && (p.snapToken || p.paymentUrl) && (
                      <div className="col-start-2 row-span-2 mt-1 justify-self-end">
                        <ResumePaymentButton
                          orderId={p.orderId}
                          provider={p.provider}
                          token={p.snapToken}
                          redirectUrl={p.paymentUrl}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} />
      </section>
    </>
  );
}
