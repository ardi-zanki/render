import { Shield } from "lucide-react";

import { AdminNav } from "@/components/app/admin-nav";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Shield className="size-4" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            Admin
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Kelola pengguna, render, pembayaran, dan audit.
          </p>
        </div>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
