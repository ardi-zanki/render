import {
  ArrowRight,
  Building2,
  Maximize2,
  Palette,
  Sofa,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

const modes = [
  { icon: Sofa, name: "Interior", desc: "Render ruangan realistis." },
  { icon: Building2, name: "Exterior", desc: "Fasad & bangunan." },
  { icon: Palette, name: "Style Transfer", desc: "Tiru gaya referensi." },
  { icon: Maximize2, name: "Upscale", desc: "Naikkan resolusi." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <ModeToggle />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Daftar Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 sm:pt-24">
          <div className="flex flex-col items-center gap-6 text-center">
            <Badge variant="violet">
              <Sparkles className="size-3" /> Arsitektur Intelligence
            </Badge>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-foreground sm:text-6xl">
              Render arsitektur,{" "}
              <span className="rounded-xl bg-primary px-3 text-primary-foreground">
                tinggal klik
              </span>
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              Upload gambar desain, pilih mode render, dan dapatkan visual
              arsitektur realistis dalam hitungan detik — tanpa software berat.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Mulai Gratis <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/design-system">Lihat Design System</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Gratis 3 kredit untuk akun baru. Tanpa kartu kredit.
            </p>
          </div>

          {/* Mode cards */}
          <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {modes.map((m) => (
              <Card key={m.name}>
                <CardContent className="flex flex-col gap-3 py-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <m.icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo size={24} />
          <p>© {new Date().getFullYear()} RenderAI — Render Arsitektur Berbasis AI</p>
        </div>
      </footer>
    </div>
  );
}
