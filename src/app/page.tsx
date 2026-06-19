import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Layers3,
  Play,
  Sparkles,
} from "lucide-react";

import {
  FinalCta,
  ProductPreview,
  SectionHeader,
  ShowcaseGrid,
} from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listActivePaymentPackages } from "@/lib/payments/service";
import { formatCredits, formatPrice, packageCopy } from "@/lib/pricing";
import { getServerSession } from "@/lib/session";
import {
  faqs,
  features,
  landingNavItems,
  workflowSteps,
} from "@/lib/marketing";

export const metadata: Metadata = {
  title: "RenderAI - Workspace Render AI untuk Arsitektur & Interior",
  description:
    "RenderAI membantu tim arsitektur dan interior membuat opsi visual dari draft desain, menata hasil per project, dan mempercepat review klien.",
};

export const revalidate = 3600;

export default async function LandingPage() {
  const [dbPackages, session] = await Promise.all([
    listActivePaymentPackages(),
    getServerSession(),
  ]);
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);
  const packageCtaHref = isAuthenticated ? "/payments" : "/register";
  const primaryHref = isAuthenticated ? "/dashboard" : "/register";
  const pricing = dbPackages.map((pkg) => {
    const copy = packageCopy(pkg.slug);
    return {
      name: pkg.name,
      credits: formatCredits(pkg.credits, pkg.bonusCredits),
      price: formatPrice(pkg.price),
      note: copy.note,
      highlighted: copy.highlighted,
      features: copy.features,
    };
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader
        nav={landingNavItems}
        authenticated={isAuthenticated}
        showThemeToggle={false}
      />

      <main>
        <section className="overflow-hidden border-b border-border/70 bg-card">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-12 lg:pt-12">
            <div className="inline-flex items-center justify-center gap-2 rounded-md border border-border/70 bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-hairline">
              <Sparkles className="size-3.5 text-primary" />
              Render AI untuk arsitektur & interior
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-[3.4rem]">
              Render visual dari draft desain
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-[17px]">
              Ubah screenshot, sketsa, atau foto ruang menjadi opsi visual yang
              siap direview.
            </p>

            <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Button
                asChild
                className="h-10 w-full max-w-[18.5rem] px-5 text-sm sm:w-[13.75rem] sm:max-w-none"
              >
                <Link href={primaryHref}>
                  {isAuthenticated ? "Open Studio" : "Mulai sekarang"}
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-10 w-full max-w-[18.5rem] px-5 text-sm shadow-none sm:w-[13.75rem] sm:max-w-none"
              >
                <Link href="#showcase">
                  Lihat contoh <Play />
                </Link>
              </Button>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Workflow RenderAI"
            title="Eksplorasi visual dalam satu alur"
            description="Unggah materi, atur arahan, simpan hasil."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-lg border-border/70 bg-card/90 shadow-none"
              >
                <CardContent className="flex flex-col gap-4 py-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/80 text-primary">
                    <feature.icon className="size-4" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold tracking-normal text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="showcase" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Galeri Visual"
            title="Contoh visual siap direview"
            description="Bandingkan mood interior dan eksterior dengan cepat."
          />
          <div className="mt-9">
            <ShowcaseGrid />
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Cara Kerja"
            title="Dari input ke review"
            description="Tiga langkah sederhana untuk membuat opsi visual."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border/70 bg-card p-5 shadow-soft"
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="harga" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Paket Kredit"
            title="Paket kredit fleksibel"
            description="Mulai kecil, tambah saat project butuh lebih banyak opsi."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "rounded-lg border-primary/80 shadow-soft ring-1 ring-primary/15"
                    : "rounded-lg border-border/70 shadow-none"
                }
              >
                <CardContent className="flex h-full flex-col py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Layers3 className="size-4 text-primary" />
                        {plan.credits}
                      </p>
                    </div>
                    {plan.highlighted && (
                      <Badge className="bg-primary text-primary-foreground">
                        Populer
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-2xl font-semibold tracking-normal text-foreground">
                      {plan.price}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.note}
                    </p>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 h-9 w-full text-sm shadow-none"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link href={packageCtaHref}>
                      Pilih paket <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="FAQ"
            title="Hal penting sebelum tim mulai"
            description="Jawaban singkat tentang posisi RenderAI dalam workflow desain dan cara kerja kredit."
          />
          <div className="mt-9 space-y-3">
            {faqs.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group rounded-lg border border-border/70 bg-card/90 px-5 py-4 shadow-none"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold tracking-normal text-foreground">
                  {item.q}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <FinalCta
          title="Siap mencoba RenderAI?"
          description="Buat opsi visual pertama dari materi desain Anda."
          href={primaryHref}
          label={isAuthenticated ? "Open Studio" : "Mulai sekarang"}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
