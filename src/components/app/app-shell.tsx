"use client";

import {
  CreditCard,
  ClipboardList,
  FolderOpen,
  Home,
  ImageIcon,
  Menu,
  PanelLeft,
  Plus,
  Shield,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent, type ReactNode } from "react";

import { NotificationBell } from "@/components/app/notification-bell";
import { RenderQueueButton } from "@/components/app/render-queue-button";
import { UserMenu } from "@/components/app/user-menu";
import { CreditPill } from "@/components/brand/credit-pill";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { NotificationItem } from "@/lib/notifications/ui";
import type { UserStorageUsage } from "@/lib/storage/usage";
import { cn } from "@/lib/utils";
import { zLayer } from "@/lib/z-layers";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Project", href: "/projects", icon: FolderOpen },
  { label: "Riwayat Render", href: "/renders", icon: ImageIcon },
  { label: "Pembayaran", href: "/payments", icon: CreditCard },
];

type AppUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};

type AppUserPreferences = {
  displayName: string;
  defaultRenderMode: string;
  defaultOutputFormat: string;
};

const SIDEBAR_STORAGE_KEY = "renderai.sidebar.expanded";
const SIDEBAR_COOKIE_KEY = "renderai_sidebar_expanded";

function persistSidebarState(expanded: boolean) {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, String(expanded));
  document.cookie = `${SIDEBAR_COOKIE_KEY}=${String(expanded)}; path=/; max-age=31536000; samesite=lax`;
}

export function AppShell({
  user,
  preferences,
  balance,
  initialSidebarExpanded,
  unreadCount,
  notifications,
  isAdmin,
  googleConnected,
  storageUsage,
  children,
}: {
  user: AppUser;
  preferences: AppUserPreferences;
  balance: number;
  initialSidebarExpanded: boolean;
  unreadCount: number;
  notifications: NotificationItem[];
  isAdmin: boolean;
  googleConnected: boolean;
  storageUsage: UserStorageUsage;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(
    initialSidebarExpanded,
  );

  function updateSidebarExpanded(next: boolean) {
    setSidebarExpanded(next);
    try {
      persistSidebarState(next);
    } catch {
      // Ignore persistence failures.
    }
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function isNavActive(href: string) {
    if (href === "/renders") return pathname === "/renders";
    return isActive(href);
  }

  const renderNewActive = isActive("/renders/new");
  // The Render Studio is a focused full-page workspace: collapse the sidebar
  // and let the content span full width while it is open.
  const effectiveExpanded = renderNewActive ? false : sidebarExpanded;

  function openCollapsedSidebarFromEmptyArea(
    e: MouseEvent<HTMLElement>,
    expanded: boolean,
  ) {
    if (expanded) return;
    const target = e.target as HTMLElement;
    if (!target.closest("a,button")) updateSidebarExpanded(true);
  }

  function labelWithTooltip(label: string, expanded: boolean) {
    if (expanded) return <span className="truncate">{label}</span>;
    return (
      <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-elevated group-hover:block">
        {label}
      </span>
    );
  }

  function renderSidebar(forceExpanded = false) {
    const expanded = forceExpanded || effectiveExpanded;

    return (
      <aside
        onClick={(e) => openCollapsedSidebarFromEmptyArea(e, expanded)}
        className={cn(
          "flex h-full flex-col overflow-visible border-r border-border/75 bg-card transition-[width] duration-200",
          expanded ? "w-60" : "w-[72px]",
        )}
        suppressHydrationWarning
      >
        <div
          className={cn(
            "flex h-14 items-center border-b border-border/75 px-4",
            expanded ? "justify-between" : "justify-center",
          )}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className={cn(!expanded && "hidden")}
          >
            <Logo size={28} />
          </Link>
          <button
            className="text-muted-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            className={cn(
              "hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-primary lg:flex",
              !expanded && "flex",
            )}
            onClick={() => updateSidebarExpanded(!sidebarExpanded)}
            aria-label={expanded ? "Close Sidebar" : "Open Sidebar"}
            title={expanded ? "Close Sidebar" : "Open Sidebar"}
          >
            <PanelLeft className="size-5" />
          </button>
        </div>

        <div className={cn("px-3 pt-3", expanded ? "pb-0.5" : "pb-1")}>
          <Button
            asChild
            variant="ghost"
            size={expanded ? "default" : "icon"}
            className={cn(
              "group relative w-full justify-start rounded-md px-3 font-medium hover:bg-muted/80",
              !expanded && "justify-center px-0",
              renderNewActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-primary hover:bg-accent/80",
            )}
          >
            <Link
              href="/renders/new"
              onClick={() => setOpen(false)}
              title={!expanded ? "Buat render" : undefined}
            >
              <Plus className="size-4" />
              {labelWithTooltip("Buat render", expanded)}
            </Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-2 pt-1">
          {NAV.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={!expanded ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  !expanded && "justify-center px-0",
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {labelWithTooltip(item.label, expanded)}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                title={!expanded ? "Admin" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  !expanded && "justify-center px-0",
                  isActive("/admin") && !isActive("/admin/audit")
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Shield className="size-4 shrink-0" />
                {labelWithTooltip("Admin", expanded)}
              </Link>
              <Link
                href="/admin/audit"
                onClick={() => setOpen(false)}
                title={!expanded ? "Log Audit" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  !expanded && "justify-center px-0",
                  isActive("/admin/audit")
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <ClipboardList className="size-4 shrink-0" />
                {labelWithTooltip("Log Audit", expanded)}
              </Link>
            </>
          )}
        </nav>

        <div
          className={cn(
            "border-t border-border/75 p-3",
            !expanded && "pb-16",
          )}
        >
          <UserMenu
            user={user}
            preferences={preferences}
            googleConnected={googleConnected}
            storageUsage={storageUsage}
            compact={!expanded}
          />
        </div>
      </aside>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block",
          zLayer.sidebar,
          effectiveExpanded ? "lg:w-60" : "lg:w-[72px]",
        )}
        suppressHydrationWarning
      >
        {renderSidebar()}
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-overlay/45 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">
            {renderSidebar(true)}
          </div>
        </div>
      )}

      <div
        className={cn(
          "transition-[padding] duration-200",
          effectiveExpanded ? "lg:pl-60" : "lg:pl-[72px]",
        )}
        suppressHydrationWarning
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/75 bg-background/90 px-4 backdrop-blur-xl sm:px-5">
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
          {/* Page-level header slot: the Render Studio title is portaled here
              so it sits top-left, aligned with the actions on the right. */}
          <div id="app-header-slot" className="flex min-w-0 items-center" />
          <div className="ml-auto flex items-center gap-2">
            <CreditPill balance={balance} />
            <RenderQueueButton />
            <NotificationBell initialUnread={unreadCount} items={notifications} />
            <ModeToggle />
          </div>
        </header>

        <main
          className={cn(
            renderNewActive
              ? "w-full px-4 py-4 sm:px-5"
              : "mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
