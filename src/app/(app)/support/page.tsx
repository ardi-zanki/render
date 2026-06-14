import { AtSign, ExternalLink, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Support" };

const SUPPORT_EMAIL = "support@renderai.app";
const WHATSAPP_SUPPORT = "https://wa.me/6200012340001";
const INSTAGRAM_SUPPORT = "https://www.instagram.com/renderai.app";

const contacts = [
  {
    label: "Email",
    description: "Kirim pertanyaan detail, kendala akun, pembayaran, atau hasil render.",
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: Mail,
    external: false,
  },
  {
    label: "WhatsApp",
    description: "Hubungi kami untuk bantuan cepat terkait workflow dan status layanan.",
    value: "+62 000 1234 0001",
    href: WHATSAPP_SUPPORT,
    icon: MessageCircle,
    external: true,
  },
  {
    label: "Instagram",
    description: "Ikuti update produk, contoh hasil render, dan pengumuman terbaru.",
    value: "@renderai.app",
    href: INSTAGRAM_SUPPORT,
    icon: AtSign,
    external: true,
  },
] as const;

export default function SupportPage() {
  return (
    <>
      <PageHeader
        title="Support"
        description="Pilih kanal yang paling nyaman untuk menghubungi tim RenderAI."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {contacts.map((contact) => (
          <a
            key={contact.label}
            href={contact.href}
            target={contact.external ? "_blank" : undefined}
            rel={contact.external ? "noreferrer" : undefined}
            className="group block"
          >
            <Card className="h-full transition-colors hover:border-primary/35">
              <CardContent className="flex h-full flex-col gap-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
                    <contact.icon className="size-5" />
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-60 transition-colors group-hover:text-primary" />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {contact.label}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {contact.description}
                  </p>
                </div>

                <p className="truncate text-sm font-medium text-primary">
                  {contact.value}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <Card className="mt-5">
        <CardContent className="flex flex-col gap-1 py-4">
          <p className="text-sm font-semibold text-foreground">
            Jam operasional
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Senin sampai Jumat, 09.00-18.00 WIB. Kami akan membalas secepat
            mungkin pada kanal yang Anda pilih.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
