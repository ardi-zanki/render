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

import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "@/lib/session";
import { listActivePaymentPackages } from "@/lib/payments/service";
import { formatCredits, formatPrice, packageCopy } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "RenderAI - Workspace Render AI untuk Arsitektur & Interior",
  description:
    "RenderAI membantu tim arsitektur dan interior membuat opsi visual dari draft desain, menata hasil per project, dan mempercepat review klien.",
};

export const revalidate = 3600;

const navItems = [
  { label: "Fitur", href: "#fitur" },
  { label: "Contoh", href: "#showcase" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  {
    icon: Camera,
    title: "Brief Visual Lebih Cepat Terbaca",
    desc: "Ubah screenshot model, sketsa, atau foto ruang menjadi opsi visual yang lebih mudah dipahami saat diskusi konsep.",
  },
  {
    icon: Palette,
    title: "Eksplorasi Tetap Mengikuti Arah Desain",
    desc: "Atur gaya, suasana, pencahayaan, lokasi, dan catatan material agar output AI tetap dekat dengan brief project.",
  },
  {
    icon: CloudSun,
    title: "Mood Bisa Dibandingkan Lebih Awal",
    desc: "Bandingkan suasana pagi, sore, natural, atau dramatis sebelum tim masuk ke produksi visual yang lebih detail.",
  },
  {
    icon: FolderKanban,
    title: "Project dan Revisi Lebih Tertata",
    desc: "Referensi, output, dan pilihan visual tersimpan per project sehingga proses review tidak tercecer di chat atau folder terpisah.",
  },
  {
    icon: CreditCard,
    title: "Kredit Fleksibel Sesuai Kebutuhan",
    desc: "Gunakan kredit saat ada eksplorasi, presentasi, atau revisi. Tim bisa mulai kecil tanpa komitmen biaya besar di awal.",
  },
  {
    icon: BadgeCheck,
    title: "Output Siap Untuk Review Klien",
    desc: "Unduh hasil, bagikan preview, dan gunakan visual sebagai bahan diskusi yang lebih konkret dengan klien dan stakeholder.",
  },
];

const showcase = [
  {
    title: "Bedroom Suite Hangat",
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
    className: "md:row-span-2",
  },
  {
    title: "Studio Kolaborasi",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Living Area Premium",
    src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "Fasad Residence Kontemporer",
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
    className: "md:col-span-2",
  },
];

const faqs = [
  {
    q: "Apa itu RenderAI?",
    a: "RenderAI adalah workspace render berbasis AI untuk membantu tim arsitektur dan interior membuat opsi visual, menata project, dan menyimpan hasil dalam satu alur kerja.",
  },
  {
    q: "Input seperti apa yang bisa digunakan?",
    a: "Anda bisa memulai dari screenshot desain, foto ruang, sketsa, atau visual referensi. Hasil terbaik tetap bergantung pada kualitas input dan arahan visual yang diberikan.",
  },
  {
    q: "Apa bedanya dengan membuat render manual?",
    a: "RenderAI mempercepat eksplorasi konsep dan komunikasi awal. Render manual tetap penting untuk visual final detail, sementara RenderAI membantu tim memilih arah visual lebih cepat.",
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

export default async function LandingPage() {
  const [dbPackages, session] = await Promise.all([
    listActivePaymentPackages(),
    getServerSession(),
  ]);
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);
  const packageCtaHref = isAuthenticated ? "/payments" : "/register";
  const pricing = dbPackages.map((pkg) => {
    const copy = packageCopy(pkg.slug);
    return {
      name: pkg.name,
      credits: formatCredits(pkg.credits, pkg.bonusCredits),
      price: formatPrice(pkg.price),
      note: copy.note,
      highlighted: copy.highlighted,
      features: copy.features,
    };
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader nav={navItems} authenticated={isAuthenticated} />

      <main>
        <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-10 pt-8 text-center sm:px-6 sm:pb-12 sm:pt-10">
          <div className="inline-flex items-center justify-center rounded-md border border-border/70 bg-card/85 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-hairline">
            Render AI untuk review konsep arsitektur & interior
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-display">
            Dari draft desain ke opsi visual yang siap dibahas klien
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-[17px]">
            RenderAI membantu studio desain mengubah materi awal menjadi visual
            yang lebih jelas, menyimpan hasil per project, dan mempercepat
            keputusan sebelum produksi render final.
          </p>

          <div className="mt-5 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Button
              asChild
              className="h-10 w-full max-w-[18.5rem] px-5 text-sm sm:w-[13.75rem] sm:max-w-none"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open Studio" : "Mulai workspace visual"}
                <Sparkles />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-10 w-full max-w-[18.5rem] px-5 text-sm shadow-none sm:w-[13.75rem] sm:max-w-none"
            >
              <Link href="#showcase">
                Lihat contoh visual <Play />
              </Link>
            </Button>
          </div>

          <ProductPreview />
        </section>

        <section id="fitur" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHeader
            eyebrow="Workflow RenderAI"
            title="Satu alur untuk eksplorasi, review, dan arsip visual"
            description="Dari materi awal sampai hasil siap dibagikan, RenderAI menjaga proses visual tetap sederhana, terdokumentasi, dan mudah dipahami."
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
                    <h3 className="text-base font-semibold tracking-normal text-foreground">
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

        <section id="showcase" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHeader
            eyebrow="Galeri Visual"
            title="Buat arah desain terasa lebih konkret sejak awal"
            description="Siapkan mood awal, bandingkan suasana ruang, dan bawa opsi visual yang lebih mudah dibahas ke sesi review."
          />
          <div className="mt-8 grid auto-rows-[200px] gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[240px]">
            {showcase.map((item, index) => (
              <figure
                key={item.title}
                className={`group relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft ${item.className ?? ""}`}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-overlay/70 to-transparent p-4 text-left text-sm font-semibold text-overlay-foreground">
                  {item.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-4 border-y border-border/70 py-6 md:grid-cols-3">
            {[
              ["1", "Unggah materi desain", "Mulai dari foto ruang, screenshot model, sketsa, atau referensi visual yang relevan."],
              ["2", "Lengkapi arahan visual", "Pilih mode render, gaya, pencahayaan, suasana, dan detail yang perlu dipertahankan."],
              ["3", "Review, simpan, bagikan", "Bandingkan output, simpan per project, lalu unduh atau bagikan sebagai bahan diskusi."],
            ].map(([step, title, desc]) => (
              <div key={step} className="flex gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-normal sm:text-base">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="harga" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHeader
            eyebrow="Paket Kredit"
            title="Mulai kecil, tambah kapasitas saat project bergerak"
            description="Sistem kredit menjaga biaya tetap fleksibel untuk eksplorasi, presentasi, dan revisi yang datang bertahap."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "rounded-lg border-primary/80 shadow-soft ring-1 ring-primary/15"
                    : "rounded-lg border-border/70 shadow-none"
                }
              >
                <CardContent className="flex h-full flex-col py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{plan.name}</p>
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
                    <p className="text-2xl font-semibold tracking-normal text-foreground">
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
                    <Link href={packageCtaHref}>
                      Pilih paket <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionHeader
            eyebrow="FAQ"
            title="Hal penting sebelum tim mulai"
            description="Jawaban singkat tentang posisi RenderAI dalam workflow desain dan cara kerja kredit."
          />
          <div className="mt-8 space-y-3">
            {faqs.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group rounded-lg border border-border/70 bg-card/90 px-5 py-4 shadow-none"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold tracking-normal text-foreground">
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

        <section className="mt-8 bg-primary px-4 py-10 text-center text-primary-foreground sm:px-6 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              Mulai review visual yang lebih jelas dari project berikutnya
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
              Buat beberapa opsi dari materi desain yang sudah ada, simpan per
              project, lalu bawa hasilnya ke diskusi klien dengan konteks yang
              lebih rapi.
            </p>
            <Button
              variant="secondary"
              asChild
              className="mt-6 h-10 px-5 text-sm shadow-none"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open Studio" : "Buat akun RenderAI"}{" "}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
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
      <p className="text-xs font-semibold uppercase text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2.5 text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-3xl">
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
    <div className="mt-10 w-full rounded-lg border border-border/70 bg-card p-2 shadow-soft">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4" />
          RenderAI Studio
        </div>
        <span className="text-xs font-medium text-primary-foreground/75">
          Brief, opsi visual, dan review klien dalam satu workspace
        </span>
      </div>
      <div className="grid overflow-hidden rounded-md border border-border/70 bg-background text-left lg:grid-cols-[230px_1fr_210px]">
        <aside className="hidden border-r border-border/70 bg-card p-4 lg:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
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
              <h3 className="font-semibold tracking-normal text-foreground">
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
            <div className="absolute inset-y-0 left-1/2 w-px bg-overlay-foreground/90" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full border border-overlay-foreground/80 bg-overlay/55 px-3 py-1 text-xs font-semibold text-overlay-foreground shadow-floating">
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
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="size-4 text-primary" />
            Opsi Tersimpan
          </div>
          <div className="grid grid-cols-2 gap-2">
            {showcase.slice(0, 4).map((item, index) => (
              <Image
                key={item.title}
                src={item.src}
                alt={item.title}
                width={120}
                height={120}
                loading={index === 0 ? "eager" : "lazy"}
                className="aspect-square rounded-md object-cover"
              />
            ))}
          </div>
          <div className="mt-4 rounded-md bg-secondary p-3 text-xs leading-5 text-muted-foreground">
            Setiap opsi tersimpan bersama project agar revisi dan keputusan
            visual tetap mudah diikuti.
          </div>
        </aside>
      </div>
    </div>
  );
}
