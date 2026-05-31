import { asc, eq } from "drizzle-orm";
import { Check } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { paymentPackages } from "@/db/schema";

export const metadata: Metadata = { title: "Pembayaran" };

const idr = new Intl.NumberFormat("id-ID");

export default async function PaymentsPage() {
  const packages = await db.query.paymentPackages.findMany({
    where: eq(paymentPackages.isActive, true),
    orderBy: asc(paymentPackages.sortOrder),
  });

  return (
    <>
      <PageHeader
        title="Beli Kredit"
        description="Pilih paket kredit untuk terus berkarya. 1 kredit = 1 render."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const featured = pkg.slug === "creator";
          const perCredit = Math.round(pkg.price / pkg.credits);
          return (
            <Card
              key={pkg.id}
              className={featured ? "border-primary ring-2 ring-primary/30" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{pkg.name}</CardTitle>
                  {featured && <Badge>Populer</Badge>}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-success" />
                  {idr.format(pkg.credits)} kredit
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Rp
                  </span>
                  <span className="text-3xl font-extrabold text-foreground">
                    {idr.format(pkg.price)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ Rp{idr.format(perCredit)} / render
                </p>
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-2">
                <Button
                  variant={featured ? "default" : "outline"}
                  disabled
                  className="w-full"
                >
                  Beli Paket
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Pembayaran via Midtrans (Phase 4)
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
