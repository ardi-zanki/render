"use client";

import { ClipboardList, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/app/admin-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAudit = pathname === "/admin/audit";
  const Icon = isAudit ? ClipboardList : Shield;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold leading-tight text-foreground">
            {isAudit ? "Log Audit" : "Admin"}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {isAudit
              ? "Pantau riwayat aktivitas admin dan perubahan penting."
              : "Kelola pengguna, render, pembayaran, dan audit."}
          </p>
        </div>
      </div>
      {!isAudit && <AdminNav />}
      {children}
    </div>
  );
}
