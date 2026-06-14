import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { SimulatePayButton } from "@/components/app/simulate-pay-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/env";

export const metadata: Metadata = { title: "Simulasi Pembayaran" };

export default async function SimulatePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const isMock = env.PAYMENT_PROVIDER === "mock";

  return (
    <div className="mx-auto w-full max-w-lg">
      <PageHeader
        title="Simulasi Pembayaran"
        description="Halaman dev untuk menguji alur top-up tanpa Midtrans asli."
      />
      <Card className="w-full">
        <CardContent className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/60 px-4 py-3.5">
            <FlaskConical className="size-5 text-primary" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">
                Mode mock
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {order ?? "(tanpa order id)"}
              </span>
            </div>
          </div>

          {isMock && order ? (
            <SimulatePayButton orderId={order} />
          ) : (
            <Alert>
              <AlertDescription>
                Halaman ini hanya aktif saat `PAYMENT_PROVIDER=mock`. Dengan
                Midtrans asli, pembayaran ditangani lewat Snap.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
