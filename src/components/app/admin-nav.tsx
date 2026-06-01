"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS: [string, string][] = [
  ["/admin", "Ringkasan"],
  ["/admin/users", "User"],
  ["/admin/projects", "Project"],
  ["/admin/renders", "Render"],
  ["/admin/payments", "Pembayaran"],
  ["/admin/credits", "Credit Transactions"],
  ["/admin/packages", "Payment Packages"],
  ["/admin/notifications", "Notifications"],
  ["/admin/settings", "Settings"],
  ["/admin/audit", "Audit Log"],
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map(([href, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3.5 py-2 text-sm font-medium transition-colors",
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
