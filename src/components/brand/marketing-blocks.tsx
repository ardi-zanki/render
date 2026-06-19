import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Sparkles, Zap } from "lucide-react";
import type { ReactNode } from "react";

import { BeforeAfterSlider } from "@/components/brand/before-after-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showcase } from "@/lib/marketing";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-2.5 text-2xl font-semibold leading-tight tracking-normal text-foreground sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border/70 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl lg:text-display">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border/70 bg-card p-2 shadow-soft",
        compact ? "mt-0" : "mt-10",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-background px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="size-4 text-primary" />
          RenderAI Studio
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          Brief, render, review
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-border/70 bg-background p-3 text-left sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Project klien
            </p>
            <h3 className="font-semibold tracking-normal text-foreground">
              Kamar utama
            </h3>
          </div>
          <Badge variant="success">
            <Zap /> Siap ditinjau
          </Badge>
        </div>

        <BeforeAfterSlider />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="size-4" />
            Geser untuk membandingkan asli dan hasil.
          </div>
          <Button size="sm" asChild>
            <Link href="/renders/new">Render</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ShowcaseGrid() {
  return (
    <div className="grid auto-rows-[200px] gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[240px]">
      {showcase.map((item, index) => (
        <figure
          key={item.title}
          className={cn(
            "group relative overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft",
            item.className,
          )}
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
  );
}

export function FinalCta({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="bg-primary px-4 py-10 text-center text-primary-foreground sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary-foreground/80">
          {description}
        </p>
        <Button
          variant="secondary"
          asChild
          className="mt-6 h-10 px-5 text-sm shadow-none"
        >
          <Link href={href}>{label}</Link>
        </Button>
      </div>
    </section>
  );
}
