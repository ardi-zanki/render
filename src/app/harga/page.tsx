import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

export const metadata: Metadata = {
  title: "Harga RenderAI",
  description: "Paket kredit RenderAI untuk membuat render arsitektur AI.",
};

const packages = [
  ["Starter", "30 kredit", "Rp79.000", "Untuk validasi workflow awal"],
  ["Creator", "100 kredit", "Rp249.000", "Untuk presentasi dan revisi rutin"],
  ["Studio", "300 kredit", "Rp735.000", "Untuk beberapa project berjalan"],
  ["Agency", "1.000 kredit", "Rp2.300.000", "Untuk kebutuhan visual volume tinggi"],
];

export default function HargaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">
            Paket Kredit
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            Harga yang mengikuti ritme project desain
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            RenderAI memakai sistem kredit. Mulai kecil untuk validasi workflow,
            lalu tambah kapasitas saat kebutuhan visual meningkat.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map(([name, credits, price, note]) => (
            <Card key={name} className={name === "Creator" ? "border-primary/70 ring-1 ring-primary/15" : ""}>
              <CardContent className="flex h-full flex-col gap-4 py-5">
                <div>
                  <h2 className="text-base font-semibold">{name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{credits}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tracking-normal">{price}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{note}</p>
                </div>
                <Button asChild className="mt-auto">
                  <Link href="/register">Mulai render</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo size={28} byline="Pricing" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
