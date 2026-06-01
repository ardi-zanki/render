import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

export const metadata: Metadata = {
  title: "Tentang RenderAI",
  description:
    "Tentang RenderAI, platform AI rendering untuk arsitektur dan interior.",
};

export default function TentangPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-5">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-5">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">Tentang RenderAI</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Workspace AI rendering untuk arsitektur Indonesia
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            RenderAI membantu arsitek, interior designer, kontraktor, developer
            properti, agen properti, dan pemilik rumah membuat visual
            arsitektur realistis lebih cepat dari gambar desain awal.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="grid gap-5 py-6 md:grid-cols-3">
            {[
              ["Cepat", "Upload gambar, pilih mode, lalu proses dengan AI."],
              ["Terkelola", "Hasil tersimpan per project dan mudah dilacak."],
              ["Lokal", "UI Bahasa Indonesia dan pembayaran Rupiah."],
            ].map(([title, desc]) => (
              <section key={title}>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {desc}
                </p>
              </section>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
