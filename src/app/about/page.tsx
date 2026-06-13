import type { Metadata } from "next";
import { BadgeCheck, FolderKanban, Wand2 } from "lucide-react";

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Tentang RenderAI",
  description:
    "Tentang RenderAI, workspace render AI untuk membantu tim arsitektur dan interior mengeksplorasi visual dengan lebih rapi.",
};

const principles = [
  {
    icon: Wand2,
    title: "Eksplorasi yang terarah",
    desc: "RenderAI membantu tim membuat opsi visual dari materi desain yang sudah ada tanpa kehilangan konteks brief.",
  },
  {
    icon: FolderKanban,
    title: "Alur kerja yang tertata",
    desc: "Project, referensi, dan hasil render disimpan di satu tempat agar review dan revisi lebih mudah diikuti.",
  },
  {
    icon: BadgeCheck,
    title: "Siap untuk diskusi",
    desc: "Output digunakan sebagai bahan komunikasi konsep, mood approval, dan pengambilan keputusan visual awal.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-5 sm:py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Tentang RenderAI
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-normal sm:text-3xl">
            Workspace visual untuk review desain yang lebih jelas
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            RenderAI dibangun untuk arsitek, interior designer, kontraktor,
            developer properti, dan pemilik rumah yang membutuhkan opsi visual
            cepat namun tetap rapi untuk diskusi dan pengambilan keputusan.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex flex-col gap-4 py-5">
                <div className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-5">
          <CardContent className="py-5">
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Fokus RenderAI bukan menggantikan proses desain, melainkan
              mempercepat tahap eksplorasi visual. Tim tetap memegang keputusan
              desain, sementara AI membantu membuat opsi yang lebih cepat
              dibanding memulai setiap visual dari nol.
            </p>
          </CardContent>
        </Card>
      </main>

      <PublicFooter />
    </div>
  );
}
