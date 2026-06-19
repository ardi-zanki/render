import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FinalCta } from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/lib/marketing";
import { getServerSession } from "@/lib/session";

type BlogDetailProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const [{ slug }, session] = await Promise.all([params, getServerSession()]);
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <article>
          <header className="border-b border-border/70 bg-card">
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
              <Link
                href="/blog"
                className="inline-flex text-sm font-semibold text-primary hover:underline"
              >
                Kembali ke blog
              </Link>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="info">{post.category}</Badge>
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
                {post.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {post.excerpt}
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border/70 bg-muted">
              <Image
                src={post.image}
                alt={post.title}
                fill
                priority
                unoptimized
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 sm:pb-16">
            <div className="space-y-5 text-base leading-8 text-muted-foreground">
              {post.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        <FinalCta
          title="Ubah wawasan menjadi workflow render yang lebih terarah"
          description="Coba RenderAI untuk menyusun opsi visual project Anda berikutnya."
          href={isAuthenticated ? "/dashboard" : "/register"}
          label={isAuthenticated ? "Buka studio" : "Mulai sekarang"}
        />
      </main>

      <PublicFooter />
    </div>
  );
}
