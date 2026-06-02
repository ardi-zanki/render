import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { paymentPackages } from "@/db/schema";
import { formatCredits, formatPrice, packageCopy } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Harga RenderAI",
  description: "Paket kredit RenderAI untuk membuat render arsitektur AI.",
};

export const revalidate = 3600;

export default async function HargaPage() {
  const packages = await db.query.paymentPackages.findMany({
    where: eq(paymentPackages.isActive, true),
    orderBy: asc(paymentPackages.sortOrder),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Paket Kredit
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Harga yang mengikuti ritme project desain
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            RenderAI memakai sistem kredit. Mulai kecil untuk validasi workflow,
            lalu tambah kapasitas saat kebutuhan visual meningkat.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <CardContent className="flex h-full flex-col gap-4 py-5">
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
