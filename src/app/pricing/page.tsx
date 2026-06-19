import { Check, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  FinalCta,
  PageHero,
  SectionHeader,
} from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listActivePaymentPackages } from "@/lib/payments/service";
import { formatCredits, formatPrice, packageCopy } from "@/lib/pricing";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Harga RenderAI",
  description:
    "Paket kredit RenderAI untuk eksplorasi visual arsitektur dan interior berbasis AI.",
};

export const revalidate = 3600;

const notes = [
  "Tanpa langganan bulanan.",
  "Kredit dipakai saat render.",
  "Tambah paket kapan saja.",
];

export default async function PricingPage() {
  const [packages, session] = await Promise.all([
    listActivePaymentPackages(),
    getServerSession(),
  ]);
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);
  const packageCtaHref = isAuthenticated ? "/payments" : "/register";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <PageHero
          eyebrow="Paket Kredit"
          title="Kredit fleksibel untuk render AI"
          description="Mulai dari paket kecil, lalu tambah kapasitas kapan saja saat project membutuhkan lebih banyak opsi visual."
        >
          <div className="rounded-lg border border-border/70 bg-background p-5 shadow-soft">
            <p className="text-sm font-semibold text-foreground">
              Yang sudah termasuk
            </p>
            <div className="mt-4 space-y-3">
              {notes.map((note) => (
                <div key={note} className="flex gap-3 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </PageHero>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Pilihan Paket"
            title="Pilih kapasitas sesuai kebutuhan"
            description="Cocok untuk eksplorasi kecil pada satu project hingga banyak revisi pada beberapa project sekaligus."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg) => {
              const copy = packageCopy(pkg.slug);
              return (
                <Card
                  key={pkg.id}
                  className={
                    copy.highlighted
                      ? "border-primary/70 shadow-soft ring-1 ring-primary/15"
                      : "shadow-none"
                  }
                >
                  <CardContent className="flex h-full flex-col gap-4 py-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-semibold">{pkg.name}</h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Layers3 className="size-4 text-primary" />
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
                    <Button
                      asChild
                      className="mt-auto"
                      variant={copy.highlighted ? "default" : "outline"}
                    >
                      <Link href={packageCtaHref}>Mulai render</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="bg-card px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {[
              ["Kontrol biaya", "Beli kredit saat dibutuhkan, tanpa komitmen bulanan yang berat."],
              ["Cocok untuk revisi", "Tambah kapasitas ketika review klien membutuhkan variasi baru."],
              ["Siap untuk tim", "Project dan hasil tetap tersimpan agar penggunaan kredit mudah diikuti."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border border-border/70 bg-background p-5">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <FinalCta
          title="Siapkan kredit render Anda"
          description="Pilih paket yang sesuai ritme tim, lalu mulai membuat opsi visual untuk project berikutnya."
          href={packageCtaHref}
          label={isAuthenticated ? "Buka pembayaran" : "Mulai sekarang"}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
