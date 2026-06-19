import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHero, SectionHeader } from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/marketing";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Blog RenderAI",
  description:
    "Artikel RenderAI tentang workflow render AI, review konsep, project visual, dan penggunaan kredit.",
};

export default async function BlogPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);
  const [featured, ...posts] = blogPosts;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <PageHero
          eyebrow="Blog"
          title="Catatan singkat untuk workflow visual"
          description="Panduan praktis untuk review konsep, revisi, dan penggunaan RenderAI."
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft">
            <Image
              src={featured.image}
              alt={featured.title}
              fill
              priority
              unoptimized
              sizes="(min-width: 1024px) 440px, 100vw"
              className="object-cover"
            />
          </div>
        </PageHero>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Artikel Terbaru"
            title="Insight praktis untuk tim desain"
            description="Brief lebih jelas, revisi lebih mudah diikuti."
          />

          <article className="mt-9 grid overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft md:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[260px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                unoptimized
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="info">{featured.category}</Badge>
                <span>{featured.date}</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-normal text-foreground">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {featured.excerpt}
              </p>
              <Button asChild className="mt-5 w-fit">
                <Link href={`/blog/${featured.slug}`}>Baca artikel</Link>
              </Button>
            </div>
          </article>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-soft"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{post.category}</Badge>
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold leading-snug tracking-normal text-foreground">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
                  >
                    Baca selengkapnya
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
