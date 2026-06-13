import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listActivePaymentPackages } from "@/lib/payments/service";
import { formatCredits, formatPrice, packageCopy } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Harga RenderAI",
  description:
    "Paket kredit RenderAI untuk eksplorasi visual arsitektur dan interior berbasis AI.",
};

export const revalidate = 3600;

export default async function PricingPage() {
  const packages = await listActivePaymentPackages();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Paket Kredit
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">
            Kredit fleksibel untuk setiap ritme project desain
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            Mulai dari kebutuhan eksplorasi kecil, lalu tambah kapasitas saat
            presentasi, revisi, dan jumlah project meningkat.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const copy = packageCopy(pkg.slug);
            return (
              <Card
                key={pkg.id}
                className={
                  copy.highlighted
                    ? "border-primary/70 ring-1 ring-primary/15"
                    : ""
                }
              >
                <CardContent className="flex h-full flex-col gap-3.5 py-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold">{pkg.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatCredits(pkg.credits, pkg.bonusCredits)}
                      </p>
                    </div>
                    {copy.highlighted && <Badge>Populer</Badge>}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-normal">
                      {formatPrice(pkg.price)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {copy.note}
                    </p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {copy.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-auto">
                    <Link href="/register">Mulai render</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
