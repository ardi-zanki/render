import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Camera,
  Check,
  ChevronRight,
  CloudSun,
  CreditCard,
  FolderKanban,
  ImageIcon,
  Layers3,
  Palette,
  Play,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

export const metadata: Metadata = {
  title: "RenderAI - AI Rendering Workspace untuk Desain Ruang",
  description:
    "RenderAI membantu tim arsitektur dan interior mengubah draft desain menjadi visual presentasi, variasi mood, dan aset project yang rapi.",
};

const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Contoh Visual", href: "#showcase" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: Camera,
    title: "Dari Draft ke Visual Presentasi",
    desc: "Mulai dari screenshot desain, sketsa, atau foto ruang. RenderAI membantu membangun visual yang lebih mudah dibaca klien.",
  },
  {
    icon: Palette,
    title: "Arahan Visual yang Terstruktur",
    desc: "Pilih gaya, pencahayaan, suasana, dan detail material lewat kontrol yang jelas, lalu tambah catatan desain seperlunya.",
  },
  {
    icon: CloudSun,
    title: "Eksplorasi Mood Lebih Cepat",
    desc: "Bandingkan nuansa hangat, terang, dramatis, atau natural tanpa mengulang proses produksi visual dari awal.",
  },
  {
    icon: FolderKanban,
    title: "Riwayat Render Per Project",
    desc: "Setiap visual tersimpan di project yang sesuai, sehingga revisi, opsi desain, dan hasil final tetap mudah dilacak.",
  },
  {
    icon: CreditCard,
    title: "Kredit Sesuai Ritme Kerja",
    desc: "Top up saat ada kebutuhan presentasi atau eksplorasi konsep. Cocok untuk studio kecil, freelancer, dan tim project.",
  },
  {
    icon: BadgeCheck,
    title: "Output Siap Dibahas",
    desc: "Unduh hasil, bagikan preview, dan gunakan visual sebagai bahan diskusi sebelum masuk ke produksi render final.",
  },
];

const showcase = [
  {
    title: "Konsep Kamar Hangat",
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    className: "md:row-span-2",
  },
  {
    title: "Ruang Kerja Terbuka",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Living Area Modern",
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Fasad Hunian Kontemporer",
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    className: "md:col-span-2",
  },
];

const pricing = [
  {
    name: "Starter",
    credits: "30 kredit",
    price: "Rp49.000",
    note: "Untuk validasi workflow awal",
    features: ["Cukup untuk eksplorasi ringan", "Project dan riwayat render", "Mode interior dan eksterior"],
  },
  {
    name: "Creator",
    credits: "100 kredit",
    price: "Rp129.000",
    note: "Untuk presentasi rutin",
    highlighted: true,
    features: ["Lebih leluasa membuat opsi", "Project dan riwayat render", "Bagikan dan unduh hasil"],
  },
  {
    name: "Studio",
    credits: "300 kredit",
    price: "Rp299.000",
    note: "Untuk beberapa project aktif",
    features: ["Cocok untuk tim desain", "Project dan riwayat render", "Bagikan dan unduh hasil"],
  },
  {
    name: "Agency",
    credits: "1.000 kredit",
    price: "Rp799.000",
    note: "Untuk produksi visual skala besar",
    features: ["Kapasitas render tinggi", "Project dan riwayat render", "Bagikan dan unduh hasil"],
  },
];

const faqs = [
  {
    q: "Apa itu RenderAI?",
    a: "RenderAI adalah workspace visual berbasis AI untuk membantu tim arsitektur dan interior membuat opsi render, mengelola project, dan menyimpan hasil dalam satu alur kerja.",
  },
  {
    q: "Input seperti apa yang bisa digunakan?",
    a: "Anda bisa memulai dari screenshot desain, foto ruang, sketsa, atau visual referensi. Hasil terbaik tetap bergantung pada kualitas input dan arahan visual yang diberikan.",
  },
  {
    q: "Apa bedanya dengan membuat render manual?",
    a: "RenderAI ditujukan untuk mempercepat eksplorasi dan komunikasi konsep. Tim bisa membuat beberapa arah visual lebih cepat sebelum menentukan mana yang layak dipoles lebih lanjut.",
  },
  {
    q: "Apakah hasilnya bisa dipakai untuk diskusi klien?",
    a: "Bisa. Hasil render dapat disimpan per project, diunduh, dan dibagikan sebagai bahan diskusi, mood approval, atau perbandingan opsi desain.",
  },
  {
    q: "Bagaimana sistem kreditnya?",
    a: "RenderAI memakai kredit agar penggunaan lebih fleksibel. Anda bisa membeli paket saat diperlukan dan memakai kredit tersebut untuk proses render berikutnya.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <Link href="/" aria-label="RenderAI beranda" className="justify-self-start">
            <Logo size={28} byline="by Ruma Interior" />
          </Link>
          <nav className="hidden items-center justify-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" asChild className="hidden h-9 px-4 sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild className="h-9 px-4 text-sm">
              <Link href="/register">
                Mulai sekarang <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-12 pt-10 text-center sm:px-6 sm:pb-14 sm:pt-14">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-md border border-border/70 bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span>RenderAI untuk tim desain ruang,</span>
            <span className="font-semibold text-foreground">
              dari konsep ke visual yang siap dibahas.
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl text-3xl font-extrabold leading-[1.1] tracking-normal text-foreground sm:text-4xl lg:text-5xl">
            Bangun Visual Arsitektur Lebih Cepat, Tetap Rapi Per Project
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-[17px]">
            RenderAI membantu arsitek, interior designer, dan tim properti
            mengubah draft desain menjadi opsi visual yang rapi, terukur, dan
            mudah dipresentasikan sejak tahap konsep.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-10 px-5 text-sm">
              <Link href="/register">
                Mulai Eksplorasi <Sparkles />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-10 px-5 text-sm shadow-none"
            >
              <Link href="#showcase">
                Lihat Contoh Visual <Play />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground/90">
            Akun baru mendapat kredit awal untuk mencoba workflow RenderAI.
          </p>

          <ProductPreview />
        </section>

        <section id="fitur" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <SectionHeader
            eyebrow="Workflow RenderAI"
            title="Satu alur kerja untuk membuat, membandingkan, dan menyimpan opsi visual"
            description="RenderAI dirancang untuk membantu proses desain yang dinamis: cepat mencoba arah visual, tetap rapi menyimpan hasil, dan mudah membawa output ke percakapan klien."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="rounded-lg border-border/70 bg-card/90 shadow-none"
              >
                <CardContent className="flex flex-col gap-4 py-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/80 text-primary">
                    <feature.icon className="size-4" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold tracking-normal text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="showcase" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <SectionHeader
            eyebrow="Galeri Visual"
            title="Contoh arah visual untuk membantu keputusan desain"
            description="Gunakan RenderAI untuk menyiapkan mood awal, membandingkan suasana ruang, atau membuat bahan diskusi sebelum visual final diproduksi."
          />
          <div className="mt-8 grid auto-rows-[200px] gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[240px]">
            {showcase.map((item) => (
              <figure
                key={item.title}
                className={`group relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-none ${item.className ?? ""}`}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left text-sm font-semibold text-white">
                  {item.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <div className="grid gap-5 rounded-lg border border-border/70 bg-card/90 p-5 shadow-none md:grid-cols-3">
            {[
              ["1", "Masukkan materi awal", "Gunakan foto, screenshot model, sketsa, atau referensi visual."],
              ["2", "Tentukan arah desain", "Pilih mode render, mood, gaya, dan catatan detail yang ingin dijaga."],
              ["3", "Simpan hasil terbaik", "Kelola opsi visual per project, lalu unduh atau bagikan saat dibutuhkan."],
            ].map(([step, title, desc]) => (
              <div key={step} className="flex gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {step}
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-normal sm:text-base">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="harga" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
          <SectionHeader
            eyebrow="Paket Kredit"
            title="Pilih kapasitas render sesuai ritme project"
            description="Mulai kecil untuk mencoba, tambah kredit saat kebutuhan visual meningkat. Cocok untuk workflow yang berubah dari minggu ke minggu."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "rounded-lg border-primary/80 shadow-sm ring-1 ring-primary/15"
                    : "rounded-lg border-border/70 shadow-none"
                }
              >
                <CardContent className="flex h-full flex-col py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{plan.name}</p>
                      <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Layers3 className="size-4 text-primary" />
                        {plan.credits}
                      </p>
                    </div>
                    {plan.highlighted && (
                      <Badge className="bg-primary text-primary-foreground">
                        Populer
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-2xl font-extrabold tracking-normal text-foreground">
                      {plan.price}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.note}
                    </p>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="size-4 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-6 h-9 w-full text-sm shadow-none"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    <Link href="/payments">
                      Top up kredit <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-14">
          <SectionHeader
            eyebrow="FAQ"
            title="Hal yang biasanya ditanyakan sebelum mulai"
            description="Ringkasan praktis tentang bagaimana RenderAI masuk ke workflow desain, bukan menggantikan proses kreatif tim."
          />
          <div className="mt-8 space-y-3">
            {faqs.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group rounded-lg border border-border/70 bg-card/90 px-5 py-4 shadow-none"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold tracking-normal text-foreground">
                  {item.q}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:pb-20">
          <div className="rounded-lg bg-primary px-6 py-10 text-center text-primary-foreground shadow-none sm:px-10">
            <h2 className="text-2xl font-extrabold tracking-normal sm:text-3xl">
              Bawa ide ruang ke bentuk visual lebih cepat
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              Mulai dari satu project, buat beberapa opsi visual, lalu gunakan
              hasilnya untuk memperjelas diskusi desain berikutnya.
            </p>
            <Button variant="secondary" asChild className="mt-6 h-10 px-5 text-sm shadow-none">
              <Link href="/register">
              Mulai dengan kredit awal <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Copyright ©{new Date().getFullYear()} RenderAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-5">
              <Link href="/login" className="hover:text-foreground">
                Masuk
              </Link>
              <Link href="/register" className="hover:text-foreground">
                Mulai eksplorasi
              </Link>
              <a href="#faq" className="hover:text-foreground">
                FAQ
              </a>
            </div>
            <ModeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2.5 text-2xl font-extrabold leading-tight tracking-normal text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="mt-10 w-full rounded-lg border border-border/70 bg-card p-2 shadow-sm shadow-foreground/5">
      <div className="grid overflow-hidden rounded-md border border-border/70 bg-background text-left lg:grid-cols-[230px_1fr_210px]">
        <aside className="hidden border-r border-border/70 bg-card p-4 lg:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <Wand2 className="size-4 text-primary" />
            Arahan Visual
          </div>
          {[
            ["Mode", "Interior"],
            ["Gaya", "Japandi hangat"],
            ["Cahaya", "Sore lembut"],
            ["Suasana", "Tenang dan natural"],
          ].map(([label, value]) => (
            <div key={label} className="mb-4">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <div className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground">
                {value}
              </div>
            </div>
          ))}
        </aside>

        <div className="bg-secondary/50 p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Project Interior Klien
              </p>
              <h3 className="font-bold tracking-normal text-foreground">
                Opsi Kamar Utama
              </h3>
            </div>
            <Badge variant="success">
              <Zap /> Siap ditinjau
            </Badge>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border/70 bg-card">
            <Image
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85"
              alt="Preview render interior bedroom"
              fill
              priority
              sizes="(min-width: 1024px) 720px, 100vw"
              className="size-full object-cover"
            />
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/90" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-black/55 px-3 py-1 text-xs font-semibold text-white shadow">
              Draft / Opsi visual
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="size-4" />
              Output siap diunduh dan dibandingkan
            </div>
            <Button size="sm" asChild>
              <Link href="/renders/new">
                Render <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <aside className="hidden border-l border-border/70 bg-card p-4 lg:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
            <Building2 className="size-4 text-primary" />
            Opsi Tersimpan
          </div>
          <div className="grid grid-cols-2 gap-2">
            {showcase.slice(0, 4).map((item) => (
              <Image
                key={item.title}
                src={item.src}
                alt={item.title}
                width={120}
                height={120}
                className="aspect-square rounded-md object-cover"
              />
            ))}
          </div>
          <div className="mt-4 rounded-md bg-secondary p-3 text-xs leading-5 text-muted-foreground">
            Beberapa arah visual bisa disimpan bersama project agar proses
            revisi tetap mudah diikuti.
          </div>
        </aside>
      </div>
    </div>
  );
}
