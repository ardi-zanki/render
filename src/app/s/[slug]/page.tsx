import { ArrowRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RenderImagePreview } from "@/components/app/render-image-preview";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { MODE_LABEL } from "@/lib/renders/labels";
import { getPublicRender } from "@/lib/renders/service";
import { getServerSession } from "@/lib/session";

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
  const [render, session] = await Promise.all([
    getPublicRender(slug),
    getServerSession(),
  ]);
  if (!render) notFound();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);
  const studioHref = isAuthenticated ? "/renders/new" : "/register";
  const headerCtaLabel = isAuthenticated ? "Open Studio" : "Buat akun";
  const sectionTitle = isAuthenticated
    ? "Lanjutkan eksplorasi di studio Anda"
    : "Buat render arsitektur Anda sendiri";
  const sectionDescription = isAuthenticated
    ? "Gunakan hasil ini sebagai referensi, unggah desain berikutnya, dan kelola opsi visual di workspace Anda."
    : "Unggah desain, pilih mode, dan dapatkan visual yang siap dibahas. Akun baru mendapatkan kredit awal.";
  const sectionCtaLabel = isAuthenticated ? "Open Studio" : "Mulai eksplorasi";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-5">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild>
                <a href={studioHref}>{headerCtaLabel}</a>
              </Button>
            ) : (
              <Button asChild>
                <Link href={studioHref}>{headerCtaLabel}</Link>
              </Button>
            )}
            <ModeToggle />
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
          <RenderImagePreview
            src={render.resultUrl}
            alt={`Render ${MODE_LABEL[render.mode]}`}
            className="h-auto w-full"
            imageClassName="h-auto w-full object-contain"
            downloadUrl={render.resultUrl}
            downloadName={`renderai-${slug}`}
          />
        </div>

        <p className="mt-4 text-xs font-medium text-muted-foreground">
          {render.creatorName} · {dateFmt.format(render.createdAt)}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 px-5 py-7 text-center">
          <p className="text-base font-semibold text-foreground">
            {sectionTitle}
          </p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {sectionDescription}
          </p>
          {isAuthenticated ? (
            <Button asChild>
              <a href={studioHref}>
                {sectionCtaLabel} <ArrowRight />
              </a>
            </Button>
          ) : (
            <Button asChild>
              <Link href={studioHref}>
                {sectionCtaLabel} <ArrowRight />
              </Link>
            </Button>
          )}
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
