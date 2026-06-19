import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { PageHero, SectionHeader } from "@/components/brand/marketing-blocks";
import { PublicFooter } from "@/components/brand/public-footer";
import { PublicHeader } from "@/components/brand/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { contactOptions } from "@/lib/marketing";
import { getServerSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Kontak RenderAI",
  description:
    "Hubungi RenderAI untuk pertanyaan produk, akun, pembayaran, privasi, dan kebutuhan workflow render AI.",
};

export default async function ContactPage() {
  const session = await getServerSession();
  const isAuthenticated = Boolean(session?.user && !session.user.isDisabled);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader authenticated={isAuthenticated} />

      <main className="flex-1">
        <PageHero
          eyebrow="Kontak"
          title="Hubungi tim RenderAI"
          description="Untuk produk, akun, pembayaran, atau privasi."
        >
          <Card className="shadow-soft">
            <CardContent className="py-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                <Mail className="size-4" />
              </div>
              <h2 className="mt-5 text-base font-semibold text-foreground">
                Email support
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sertakan konteks akun atau project bila relevan.
              </p>
              <Button asChild className="mt-5 w-full">
                <Link href="mailto:support@renderai.id">
                  support@renderai.id <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </PageHero>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Bantuan"
            title="Topik bantuan"
            description="Pilih konteks yang paling dekat dengan kebutuhan Anda."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {contactOptions.map((item) => (
              <Card key={item.title} className="shadow-none">
                <CardContent className="py-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <h2 className="mt-5 text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-card px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-lg border border-border/70 bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-normal text-foreground">
                Sudah punya akun?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Buka dashboard untuk melihat project dan pengaturan akun.
              </p>
            </div>
            <Button asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Open Studio" : "Masuk"} <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
