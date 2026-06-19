import type { Metadata } from "next";

import {
  FinalCta,
  PageHero,
  ProductPreview,
  SectionHeader,
} from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Card, CardContent } from "@/components/ui/card";
import { audience } from "@/lib/marketing";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tentang RenderAI",
  description:
    "Tentang RenderAI, workspace render AI untuk membantu tim arsitektur dan interior mengeksplorasi visual dengan lebih rapi.",
};

const principles = [
  {
    title: "Eksplorasi tetap terarah",
    desc: "RenderAI membantu tim membuat opsi visual dari materi desain yang sudah ada tanpa kehilangan konteks brief.",
  },
  {
    title: "Keputusan lebih mudah dilacak",
    desc: "Project, referensi, hasil render, dan variasi disimpan bersama agar review tidak tercecer.",
  },
  {
    title: "AI sebagai alat bantu studio",
    desc: "Tim tetap memegang keputusan desain. AI mempercepat opsi awal, bukan menggantikan penilaian profesional.",
  },
];

export default async function AboutPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <PageHero
          eyebrow="Tentang RenderAI"
          title="Workspace visual untuk review desain yang lebih jelas"
          description="RenderAI dibangun untuk arsitek, interior designer, kontraktor, developer properti, dan pemilik rumah yang membutuhkan opsi visual cepat namun tetap rapi untuk diskusi dan pengambilan keputusan."
        >
          <ProductPreview compact />
        </PageHero>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Prinsip Produk"
            title="Dibuat untuk mempercepat proses tanpa mengacaukan workflow"
            description="Fokus kami sederhana: visual yang lebih cepat dibaca, project yang lebih mudah diikuti, dan keputusan desain yang lebih tenang."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {principles.map((item) => (
              <Card key={item.title} className="shadow-none">
                <CardContent className="py-5">
                  <h2 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeader
              eyebrow="Untuk Siapa"
              title="Cocok untuk tim yang sering butuh opsi visual cepat"
              description="RenderAI membantu berbagai peran di tahap eksplorasi, presentasi awal, dan review."
            />
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {audience.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/70 bg-background p-5 shadow-soft"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <h3 className="mt-5 font-semibold text-foreground">
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

        <FinalCta
          title="Bangun review visual yang lebih rapi sejak project berikutnya"
          description="Mulai dari materi desain yang sudah ada, lalu susun opsi visual yang mudah dibandingkan bersama tim dan klien."
          href={isAuthenticated ? "/dashboard" : "/register"}
          label={isAuthenticated ? "Open Studio" : "Buat akun RenderAI"}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
