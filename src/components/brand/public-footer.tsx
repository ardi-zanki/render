import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ModeToggle } from "@/components/ui/mode-toggle";

const GROUPS = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "/features" },
      { label: "Harga", href: "/pricing" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Kontak", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Ketentuan Layanan", href: "/terms" },
      { label: "Kebijakan Privasi", href: "/privacy" },
    ],
  },
];

/** Shared footer for public (logged-out) marketing pages. */
export function PublicFooter() {
  return (
    <footer className="border-t border-border/80 bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.25fr_2fr]">
        <div>
          <Logo size={28} />
        </div>
        <nav className="grid gap-6 text-sm sm:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="font-semibold text-foreground">{group.title}</p>
              <div className="mt-3 flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <p className="min-w-0">
            © {new Date().getFullYear()} RenderAI. Seluruh hak cipta dilindungi.
          </p>
          <div className="shrink-0">
            <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
