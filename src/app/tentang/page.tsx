import type { Metadata } from "next";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Tentang RenderAI",
  description:
    "Tentang RenderAI, platform AI rendering untuk arsitektur dan interior.",
};

export default function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-5 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Tentang RenderAI
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">
            Workspace render AI untuk visual arsitektur yang lebih tertata
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            RenderAI membantu arsitek, interior designer, kontraktor, developer
            properti, dan pemilik rumah mengubah materi desain awal menjadi opsi
            visual yang lebih jelas untuk diskusi dan pengambilan keputusan.
          </p>
        </div>

        <Card className="mt-7">
          <CardContent className="grid gap-5 py-5 md:grid-cols-3">
            {[
              [
                "Visual cepat",
                "Upload gambar, pilih mode, lalu buat opsi visual untuk diskusi awal.",
              ],
              [
                "Project tertata",
                "Hasil, referensi, dan revisi tersimpan rapi per project.",
              ],
              [
                "Workflow lokal",
                "Antarmuka Bahasa Indonesia, kredit fleksibel, dan pembayaran Rupiah.",
              ],
            ].map(([title, desc]) => (
              <section key={title}>
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {desc}
                </p>
              </section>
            ))}
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
