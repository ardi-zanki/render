import type { Metadata } from "next";

import {
  FinalCta,
  PageHero,
  ProductPreview,
  SectionHeader,
  ShowcaseGrid,
} from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { featureGroups, workflowSteps } from "@/lib/marketing";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Fitur RenderAI",
  description:
    "Fitur RenderAI untuk membuat opsi visual, mengelola project, meninjau versi, dan mempercepat review desain.",
};

export default async function FeaturesPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <PageHero
          eyebrow="Fitur RenderAI"
          title="Semua yang dibutuhkan untuk eksplorasi visual yang rapi"
          description="RenderAI menggabungkan input desain, arahan visual, project, versi, kredit, dan output dalam satu workspace yang mudah diikuti."
        >
          <ProductPreview compact />
        </PageHero>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Kemampuan Utama"
            title="Dari ide awal sampai output siap dibahas"
            description="Setiap fitur dibuat untuk mengurangi langkah manual saat tim perlu melihat banyak opsi visual."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureGroups.map((feature) => (
              <Card key={feature.title} className="shadow-none">
                <CardContent className="py-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <feature.icon className="size-4" />
                  </div>
                  <h2 className="mt-5 text-base font-semibold text-foreground">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Workflow"
              title="Alur pendek untuk mendapatkan visual yang layak ditinjau"
              description="Mulai dari materi awal, beri arahan yang jelas, lalu gunakan hasilnya untuk mempercepat diskusi."
            />
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-lg border border-border/70 bg-background p-5"
                >
                  <p className="text-sm font-semibold text-primary">
                    {item.step}
                  </p>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Output"
            title="Visual yang mudah dibandingkan dan dibawa ke review"
            description="Gunakan hasil sebagai pembanding mood, bahan presentasi awal, atau catatan arah desain berikutnya."
          />
          <div className="mt-9">
            <ShowcaseGrid />
          </div>
        </section>

        <FinalCta
          title="Coba workflow RenderAI pada project aktif Anda"
          description="Unggah materi awal, atur arahan visual, lalu lihat bagaimana opsi render membantu mempercepat review."
          href={isAuthenticated ? "/dashboard" : "/register"}
          label={isAuthenticated ? "Open Studio" : "Buat akun RenderAI"}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
