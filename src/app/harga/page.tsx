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
  ["Starter", "30 kredit", "Rp79.000"],
  ["Creator", "100 kredit", "Rp249.000"],
  ["Studio", "300 kredit", "Rp735.000"],
  ["Agency", "1.000 kredit", "Rp2.300.000"],
];

export default function HargaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Paket Kredit</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Harga fleksibel untuk setiap ritme project
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            RenderAI memakai sistem kredit. Satu render memakai satu kredit,
            tanpa subscription wajib untuk MVP.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {packages.map(([name, credits, price]) => (
            <Card key={name}>
              <CardContent className="flex h-full flex-col gap-4 py-5">
                <div>
                  <h2 className="text-lg font-bold">{name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{credits}</p>
                </div>
                <p className="text-2xl font-extrabold">{price}</p>
                <Button asChild className="mt-auto">
                  <Link href="/register">Mulai</Link>
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
  );
}
