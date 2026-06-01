import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Check,
  Download,
  Grid3X3,
  ImageIcon,
  Layers3,
  Loader2,
  PanelTop,
  Sparkles,
  Table2,
} from "lucide-react";

import { CreditPill } from "@/components/brand/credit-pill";
import { Logo } from "@/components/brand/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const colorGroups = [
  {
    title: "Brand",
    swatches: [
      { label: "Navy Blue", token: "--primary", note: "CTA, navigasi aktif, focus" },
      { label: "Soft Blue", token: "--accent", note: "Highlight AI dan konteks" },
      { label: "Ink", token: "--foreground", note: "Teks utama" },
    ],
  },
  {
    title: "Surfaces",
    swatches: [
      { label: "Background", token: "--background", note: "Permukaan halaman" },
      { label: "Card", token: "--card", note: "Konten berbingkai" },
      { label: "Muted", token: "--muted", note: "Panel subtle" },
      { label: "Border", token: "--border", note: "Divider dan frame" },
    ],
  },
  {
    title: "Feedback",
    swatches: [
      { label: "Success", token: "--success", note: "Status selesai" },
      { label: "Warning", token: "--warning", note: "Status menunggu" },
      { label: "Info", token: "--info", note: "Update netral" },
      { label: "Destructive", token: "--destructive", note: "Aksi berisiko" },
    ],
  },
];

const typeScale = [
  ["Display", "40/48", "Headline landing"],
  ["H1", "24/32", "Judul halaman"],
  ["H2", "20/28", "Judul section"],
  ["Body", "14/24", "Form, card, tabel"],
  ["Caption", "12/18", "Meta dan helper text"],
];

const foundations = [
  {
    title: "Spacing",
    icon: Grid3X3,
    items: ["Basis 4px", "Kontrol ringkas 12-16px", "Card padding 20px", "Section landing 48-56px"],
  },
  {
    title: "Radius",
    icon: Layers3,
    items: ["4px untuk elemen kecil", "6px untuk input", "8px untuk card", "10px untuk brand mark", "Lingkaran hanya untuk avatar"],
  },
  {
    title: "Elevation",
    icon: PanelTop,
    items: ["Card default tetap flat", "Menu memakai shadow 16-24px yang lembut", "Modal memakai overlay shadow yang fokus"],
  },
];

const visualAssetRules = [
  "Visual utama harus menunjukkan ruang, project, atau UI produk yang relevan, bukan ilustrasi generik.",
  "Mockup produk memakai komponen terbaru: radius 8px, Navy Blue sebagai aksen, dan layout yang lapang.",
  "Gambar showcase menggunakan rasio stabil, crop bersih, kontras cukup, dan caption singkat.",
  "Preview fitur harus membantu pengguna memahami manfaat workflow, bukan hanya menjadi dekorasi.",
];

function Swatch({
  label,
  token,
  note,
}: {
  label: string;
  token: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-14 w-full rounded-md border border-border"
        style={{ backgroundColor: `var(${token})` }}
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{token}</span>
        <span className="text-xs text-muted-foreground">{note}</span>
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
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SpecList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-success" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-5">
          <Logo size={28} byline="Design System" />
          <div className="flex items-center gap-2">
            <CreditPill balance={30} className="hidden sm:inline-flex" />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-10 sm:px-5 sm:py-12">
        <section className="flex flex-col gap-5">
          <Badge variant="violet" className="w-fit">
            <Sparkles /> Bahasa Visual RenderAI
          </Badge>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">
                Fondasi UI yang clean, sederhana, profesional, dan konsisten
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Design system ini menjadi acuan untuk landing page, authentication,
                email, app shell, dashboard, admin, dan seluruh komponen feedback.
              </p>
            </div>
            <Card>
              <CardContent className="flex flex-col gap-3 py-5">
                <p className="text-sm font-semibold text-foreground">
                  Prinsip desain
                </p>
                <SpecList
                  items={[
                    "Konten lebih penting dari dekorasi.",
                    "Komponen padat, tetapi tetap mudah disentuh.",
                "Navy Blue menjadi identitas utama dan primary action.",
                    "Shadow hanya muncul saat ada layer atau menu.",
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        <Section
          title="Palet Warna"
          description="Primary Navy Blue dipakai untuk aksi utama, link penting, focus ring, dan status aktif. Neutral surface menjaga app tetap ringan, premium, dan profesional."
        >
          <div className="grid gap-6">
            {colorGroups.map((group) => (
              <div key={group.title} className="grid gap-3">
                <p className="text-sm font-semibold text-muted-foreground">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {group.swatches.map((swatch) => (
                    <Swatch key={swatch.token} {...swatch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        <Section
          title="Tipografi"
          description="Plus Jakarta Sans digunakan untuk semua UI. Hierarki dibuat ringkas agar dashboard, form, dan tabel tidak terasa terlalu besar."
        >
          <Card>
            <CardContent className="grid gap-5 py-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <p className="text-4xl font-extrabold leading-tight text-foreground">
                  Visual arsitektur siap dibahas
                </p>
                <p className="text-2xl font-bold text-foreground">
                  Dashboard project
                </p>
                <p className="text-base leading-7 text-foreground">
                  Body copy menjelaskan manfaat dengan jelas, tidak berlebihan,
                  dan tetap mudah dipindai oleh pengguna non-teknis.
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Secondary copy digunakan untuk helper text, metadata, dan
                  penjelasan singkat pada card.
                </p>
                <p className="font-mono text-sm text-foreground">
                  Rp129.000 - 100 kredit - VRENDR-1780227739602
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40">
                {typeScale.map(([name, size, usage]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[90px_72px_1fr] gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-semibold text-foreground">{name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {size}
                    </span>
                    <span className="text-muted-foreground">{usage}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        <Section
          title="Spacing, Radius, Shadow"
          description="Sistem ini menjaga UI tetap rapi dan tidak terasa penuh, terutama pada dashboard dan form yang berulang."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {foundations.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex flex-col gap-4 py-5">
                  <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <div className="mt-3">
                      <SpecList items={item.items} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Separator />

        <Section
          title="Tombol, Badge, Feedback"
          description="Aksi utama harus jelas. Aksi sekunder memakai outline atau ghost agar tidak bersaing dengan CTA utama."
        >
          <Card>
            <CardContent className="flex flex-col gap-6 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button>Render</Button>
                <Button variant="inverse">
                  <Download /> Unduh
                </Button>
                <Button variant="secondary">Sekunder</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Hapus</Button>
                <Button variant="link">Lupa password?</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline" aria-label="Notifikasi">
                  <Bell />
                </Button>
                <Button disabled>Disabled</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Primary</Badge>
                <Badge variant="secondary">Draft</Badge>
                <Badge variant="outline">Project</Badge>
                <Badge variant="success">
                  <Check /> Selesai
                </Badge>
                <Badge variant="warning">Menunggu</Badge>
                <Badge variant="destructive">Gagal</Badge>
                <Badge variant="info">Info</Badge>
              </div>
              <Alert variant="info">
                <AlertCircle />
                <div>
                  <AlertTitle>Feedback UI</AlertTitle>
                  <AlertDescription>
                    Alert ringkas, langsung menyebut konteks, dan tidak
                    memenuhi ruang layar.
                  </AlertDescription>
                </div>
              </Alert>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        <Section
          title="Form dan Card"
          description="Form memakai tinggi 40px, radius 6px, label singkat, dan helper text secukupnya."
        >
          <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Buat project</CardTitle>
                <CardDescription>
                  Contoh form ringkas untuk workflow app.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-name">Nama project</Label>
                  <Input id="ds-name" placeholder="Rumah Bandung" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-mode">Mode render</Label>
                  <Select id="ds-mode" defaultValue="interior">
                    <option value="interior">Interior</option>
                    <option value="exterior">Exterior</option>
                    <option value="style">Style transfer</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ds-prompt">Catatan visual</Label>
                  <Textarea
                    id="ds-prompt"
                    placeholder="Material kayu hangat, cahaya sore, suasana tenang"
                  />
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button>Simpan</Button>
                <Button variant="outline">Batal</Button>
              </CardFooter>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="flex flex-col gap-3 py-5">
                  <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-primary">
                    <ImageIcon className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      Draft ke visual presentasi
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Card menggunakan border halus, padding 20px, dan shadow
                      sangat tipis.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <EmptyState
                icon={ImageIcon}
                title="Belum ada render"
                description="Render pertama akan muncul di sini."
              />
            </div>
          </div>
        </Section>

        <Separator />

        <Section
          title="Aset Visual dan Prototype"
          description="Visual RenderAI harus terasa premium, relevan dengan arsitektur/interior, dan memakai mockup UI terbaru."
        >
          <Card>
            <CardContent className="grid gap-5 py-5 lg:grid-cols-[300px_1fr]">
              <div className="overflow-hidden rounded-lg border border-border bg-muted">
                <div className="flex items-center justify-between border-b border-border bg-primary px-3 py-2 text-primary-foreground">
                  <span className="text-sm font-bold">RenderAI Preview</span>
                  <Badge variant="secondary">Siap review</Badge>
                </div>
                <div className="grid gap-3 p-3">
                  <div className="aspect-video rounded-md bg-card" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 rounded-md bg-card" />
                    <div className="h-12 rounded-md bg-card" />
                    <div className="h-12 rounded-md bg-card" />
                  </div>
                </div>
              </div>
              <SpecList items={visualAssetRules} />
            </CardContent>
          </Card>
        </Section>

        <Separator />

        <Section
          title="Tabel, Navigasi, Modal, Loading"
          description="Komponen operasional harus dense, scannable, dan konsisten dengan app shell."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-foreground">
                  <Table2 className="size-4 text-primary" /> Pola tabel
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Item</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      ["Creator Pack", "Lunas", "Rp129.000"],
                      ["Render interior", "Selesai", "1 kredit"],
                    ].map(([item, status, value]) => (
                      <tr key={item} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="success">{status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-4 py-5">
                <div className="rounded-lg border border-border bg-muted/45 p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <PanelTop className="size-4 text-primary" /> Navigation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Dashboard", "Project", "Riwayat", "Pembayaran"].map(
                      (item, index) => (
                        <span
                          key={item}
                          className={
                            index === 0
                              ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                              : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
                          }
                        >
                          {item}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 shadow-[0_20px_60px_rgb(15_23_42/0.08)]">
                  <p className="font-bold text-foreground">Pola modal</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Dialog memakai radius 8px, padding 20px, overlay 45%, dan
                    shadow hanya untuk layer aktif.
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline">Batal</Button>
                    <Button>Konfirmasi</Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/45 px-4 py-3">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Loading state singkat, jelas, dan tidak berlebihan.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        <footer className="flex flex-col items-center gap-2 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <Logo size={24} withWordmark={false} />
          <p>
            RenderAI Design System - tipografi, warna, spacing, komponen, dan
            interaction state.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              Kembali ke landing page <ArrowRight />
            </Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
