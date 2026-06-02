import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const LINKS = [
  { label: "Harga", href: "/harga" },
  { label: "Tentang", href: "/tentang" },
  { label: "Syarat & Ketentuan", href: "/syarat" },
  { label: "Masuk", href: "/login" },
];

/** Shared footer for public (logged-out) marketing pages. */
export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Logo size={22} withWordmark={false} />
          <p>
            © {new Date().getFullYear()} RenderAI. Seluruh hak cipta
            dilindungi.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
