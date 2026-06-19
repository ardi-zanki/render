import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Fitur", href: "/features" },
      { label: "Harga", href: "/pricing" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Company",
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
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Workspace render AI untuk arsitektur dan interior yang membantu tim
            bergerak dari draft ke opsi visual dengan lebih rapi.
          </p>
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
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} RenderAI. Seluruh hak cipta dilindungi.</p>
          <p>Dibuat untuk workflow visual yang lebih tenang dan terukur.</p>
        </div>
      </div>
    </footer>
  );
}
