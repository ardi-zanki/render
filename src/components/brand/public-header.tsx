import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

/**
 * Shared header for public (logged-out) pages: landing, pricing, about, legal.
 * Keeps the wordmark, byline, CTAs, width, and sticky behaviour identical
 * across every marketing surface. Pass `nav` to render centered section links
 * (landing only).
 */
export function PublicHeader({ nav }: { nav?: NavItem[] }) {
  const hasNav = !!nav && nav.length > 0;
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6",
          hasNav && "md:grid md:grid-cols-[1fr_auto_1fr]",
        )}
      >
        <Link
          href="/"
          aria-label="RenderAI beranda"
          className="shrink-0 justify-self-start"
        >
          <Logo size={28} byline="by Ruma Interior" />
        </Link>
        {hasNav && (
          <nav className="hidden items-center justify-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
        <div className="flex items-center justify-end gap-2 justify-self-end">
          <Button
            variant="ghost"
            asChild
            className="hidden h-9 px-4 sm:inline-flex"
          >
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild className="h-9 px-4 text-sm">
            <Link href="/register">
              Mulai <ArrowRight />
            </Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
