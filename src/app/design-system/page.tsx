import {
  ArrowRight,
  Building2,
  Check,
  Download,
  Maximize2,
  Palette,
  Sofa,
  Sparkles,
} from "lucide-react";

import { CreditPill } from "@/components/brand/credit-pill";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const colorGroups = [
  {
    title: "Brand",
    swatches: [
      { name: "primary", label: "Navy", token: "--primary" },
      { name: "brand-violet", label: "Violet", token: "--brand-violet" },
      { name: "foreground", label: "Ink", token: "--foreground" },
    ],
  },
  {
    title: "Permukaan",
    swatches: [
      { name: "background", label: "Background", token: "--background" },
      { name: "card", label: "Card", token: "--card" },
      { name: "muted", label: "Muted", token: "--muted" },
      { name: "border", label: "Border", token: "--border" },
    ],
  },
  {
    title: "Semantik",
    swatches: [
      { name: "success", label: "Success", token: "--success" },
      { name: "warning", label: "Warning", token: "--warning" },
      { name: "destructive", label: "Destructive", token: "--destructive" },
      { name: "info", label: "Info", token: "--info" },
    ],
  },
];

const renderModes = [
  {
    icon: Sofa,
    name: "Interior",
    desc: "Render ruangan interior realistis dari sketsa atau foto.",
  },
  {
    icon: Building2,
    name: "Exterior",
    desc: "Visual fasad, bangunan, dan landscape.",
  },
  {
    icon: Palette,
    name: "Style Transfer",
    desc: "Terapkan gaya dari gambar referensi.",
  },
  {
    icon: Maximize2,
    name: "Upscale",
    desc: "Tingkatkan resolusi & ketajaman hasil.",
  },
];

function Swatch({
  label,
  token,
}: {
  label: string;
  token: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-lg border border-border shadow-sm"
        style={{ backgroundColor: `var(${token})` }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{token}</span>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-full">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Logo byline="Design System" />
          <div className="flex items-center gap-3">
            <CreditPill balance={30} className="hidden sm:inline-flex" />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 py-12">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <Badge variant="violet" className="w-fit">
            <Sparkles className="size-3" /> Brand Kit v0.1
          </Badge>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            Render arsitektur,{" "}
            <span className="rounded-lg bg-primary px-2 text-primary-foreground">
              tinggal klik
            </span>
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Fondasi visual untuk RenderAI — token warna, tipografi, dan komponen
            siap pakai dengan dukungan mode terang &amp; gelap. Coba tombol
            tema di kanan atas.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button size="lg">
              Buat Render <ArrowRight />
            </Button>
            <Button size="lg" variant="outline">
              Lihat Harga
            </Button>
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <Section
          title="Warna"
          description="Semua token mengikuti tema dan berubah otomatis di mode gelap."
        >
          <div className="flex flex-col gap-8">
            {colorGroups.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  {group.title}
                </span>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {group.swatches.map((s) => (
                    <Swatch key={s.token} label={s.label} token={s.token} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Typography */}
        <Section
          title="Tipografi"
          description="Plus Jakarta Sans untuk teks, Geist Mono untuk angka & kode."
        >
          <Card>
            <CardContent className="flex flex-col gap-4 py-6">
              <p className="text-4xl font-extrabold tracking-tight text-foreground">
                Siapin kopi, yuk kita ngrender
              </p>
              <p className="text-2xl font-bold text-foreground">
                Heading bagian — Semibold 24
              </p>
              <p className="text-base text-foreground">
                Teks isi (body). Cepat, ringkas, dan mudah dipahami oleh user
                non-teknis. Ukuran 16px dengan tinggi baris nyaman dibaca.
              </p>
              <p className="text-sm text-muted-foreground">
                Teks sekunder / keterangan — 14px, warna muted-foreground.
              </p>
              <p className="font-mono text-sm text-foreground">
                Rp129.000 · 100 kredit · VRENDR-1780227739602
              </p>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Buttons */}
        <Section title="Tombol" description="Variant, ukuran, dan dengan ikon.">
          <Card>
            <CardContent className="flex flex-col gap-6 py-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Render</Button>
                <Button variant="inverse">
                  <Download /> Download
                </Button>
                <Button variant="secondary">Sekunder</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Hapus</Button>
                <Button variant="link">Lupa password?</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline" aria-label="Tambah">
                  <Sparkles />
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Badges */}
        <Section title="Badge & Status" description="Status render dan transaksi.">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 py-6">
              <Badge>Baru</Badge>
              <Badge variant="secondary">Draft</Badge>
              <Badge variant="outline">Project Saya</Badge>
              <Badge variant="success">
                <Check /> Selesai
              </Badge>
              <Badge variant="warning">Processing</Badge>
              <Badge variant="destructive">Gagal</Badge>
              <Badge variant="info">Refund</Badge>
              <Badge variant="violet">
                <Sparkles /> AI
              </Badge>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Form */}
        <Section title="Form" description="Input, textarea, dan label.">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Buat Akun Baru</CardTitle>
              <CardDescription>
                Isi form berikut, yuk gabung di RenderAI!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ds-name">Nama Lengkap</Label>
                <Input id="ds-name" placeholder="Nama kamu" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ds-email">Email</Label>
                <Input
                  id="ds-email"
                  type="email"
                  placeholder="kamu@email.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ds-prompt">Instruksi tambahan</Label>
                <Textarea
                  id="ds-prompt"
                  placeholder="Contoh: suasana sore hari, material kayu hangat…"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Daftar Sekarang</Button>
            </CardFooter>
          </Card>
        </Section>

        <Separator />

        {/* Render modes */}
        <Section
          title="Mode Render"
          description="Empat mode inti — masing-masing 1 kredit."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {renderModes.map((mode) => (
              <Card
                key={mode.name}
                className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-3 py-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <mode.icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {mode.name}
                      </span>
                      <Badge variant="outline">1 kredit</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{mode.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Pricing sample */}
        <Section
          title="Kartu Harga"
          description="Contoh paket kredit (seed database)."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { name: "Starter", price: "49.000", credits: 30, featured: false },
              { name: "Creator", price: "129.000", credits: 100, featured: true },
              { name: "Studio", price: "299.000", credits: 300, featured: false },
            ].map((pkg) => (
              <Card
                key={pkg.name}
                className={
                  pkg.featured ? "border-primary ring-2 ring-primary/40" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{pkg.name}</CardTitle>
                    {pkg.featured && <Badge>Populer</Badge>}
                  </div>
                  <CardDescription>{pkg.credits} kredit render</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      Rp
                    </span>
                    <span className="text-3xl font-extrabold text-foreground">
                      {pkg.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ≈ Rp
                    {Math.round(
                      Number(pkg.price.replace(".", "")) / pkg.credits,
                    ).toLocaleString("id-ID")}{" "}
                    / render
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={pkg.featured ? "default" : "outline"}
                  >
                    Pilih Paket
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <footer className="flex flex-col items-center gap-2 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <Logo size={24} withWordmark={false} />
          <p>
            RenderAI — Render Arsitektur Berbasis AI · Design System ·{" "}
            {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
