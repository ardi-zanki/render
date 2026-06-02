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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-5">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
            Tentang RenderAI
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Workspace render AI untuk visual arsitektur yang lebih tertata
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            RenderAI membantu arsitek, interior designer, kontraktor, developer
            properti, dan pemilik rumah mengubah materi desain awal menjadi opsi
            visual yang lebih jelas untuk diskusi dan pengambilan keputusan.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="grid gap-5 py-6 md:grid-cols-3">
            {[
              [
                "Cepat",
                "Upload gambar, pilih mode, lalu buat opsi visual dengan AI.",
              ],
              [
                "Terkelola",
                "Hasil, referensi, dan revisi tersimpan rapi per project.",
              ],
              ["Lokal", "Antarmuka Bahasa Indonesia dan pembayaran Rupiah."],
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
