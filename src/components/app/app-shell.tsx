"use client";

import {
  CreditCard,
  FolderOpen,
  Home,
  ImageIcon,
  Menu,
  Plus,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { CreditPill } from "@/components/brand/credit-pill";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { NotificationItem } from "@/lib/notifications/ui";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Project", href: "/projects", icon: FolderOpen },
  { label: "Riwayat Render", href: "/renders", icon: ImageIcon },
  { label: "Pembayaran", href: "/payments", icon: CreditCard },
];

type AppUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function AppShell({
  user,
  balance,
  unreadCount,
  notifications,
  isAdmin,
  children,
}: {
  user: AppUser;
  balance: number;
  unreadCount: number;
  notifications: NotificationItem[];
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Logo size={28} />
        </Link>
        <button
          className="text-muted-foreground lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="px-4 pb-2">
        <Button asChild className="w-full">
          <Link href="/renders/new" onClick={() => setOpen(false)}>
            <Plus /> Buat Render
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive("/admin")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Shield className="size-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        {sidebar}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button
            className="text-foreground lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo size={26} withWordmark={false} />
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <CreditPill balance={balance} />
            <NotificationBell initialUnread={unreadCount} items={notifications} />
            <ModeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
