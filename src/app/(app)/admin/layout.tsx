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
      <div className="mb-5 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shield className="size-5" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold leading-tight text-foreground">
            Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengguna, render, pembayaran, dan audit.
          </p>
        </div>
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
