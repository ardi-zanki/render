import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RenderImage } from "@/components/app/render-image";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { MODE_LABEL } from "@/lib/renders/labels";
import { getPublicRender } from "@/lib/renders/share";

type Params = { params: Promise<{ slug: string }> };

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const render = await getPublicRender(slug);
  if (!render) return { title: "Render tidak ditemukan" };

  const title = `Render ${MODE_LABEL[render.mode]} · RenderAI`;
  return {
    title: { absolute: title },
    description: "Visual arsitektur dibuat dengan RenderAI.",
    openGraph: { title, images: [{ url: render.resultUrl }] },
    twitter: { card: "summary_large_image", images: [render.resultUrl] },
  };
}

export default async function PublicRenderPage({ params }: Params) {
  const { slug } = await params;
  const render = await getPublicRender(slug);
  if (!render) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-5">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button asChild>
              <Link href="/register">Buat akun</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-7 sm:px-5">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="violet">
            <Sparkles className="size-3" /> Dibuat dengan RenderAI
          </Badge>
          <Badge variant="secondary">{MODE_LABEL[render.mode]}</Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <RenderImage
            src={render.resultUrl}
            alt={`Render ${MODE_LABEL[render.mode]}`}
            className="w-full"
          />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {dateFmt.format(render.createdAt)}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 border-y border-border px-5 py-7 text-center">
          <p className="text-base font-semibold text-foreground">
            Buat render arsitektur Anda sendiri
          </p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Upload desain, pilih mode, dan dapatkan visual yang siap dibahas.
            Akun baru mendapatkan kredit awal.
          </p>
          <Button asChild>
            <Link href="/register">
              Mulai eksplorasi <ArrowRight />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RenderAI
        </div>
      </footer>
    </div>
  );
}
