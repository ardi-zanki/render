"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS: [string, string][] = [
  ["/admin", "Ringkasan"],
  ["/admin/users", "Pengguna"],
  ["/admin/projects", "Project"],
  ["/admin/renders", "Render"],
  ["/admin/payments", "Pembayaran"],
  ["/admin/credits", "Transaksi Kredit"],
  ["/admin/packages", "Paket Kredit"],
  ["/admin/notifications", "Notifikasi"],
  ["/admin/settings", "Pengaturan"],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border/75">
      {TABS.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
