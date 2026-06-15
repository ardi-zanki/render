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
import { GlobalSearchCommand } from "@/components/app/global-search-command";
import { CreditPill } from "@/components/brand/credit-pill";
import { ModeToggle } from "@/components/ui/mode-toggle";
import type { NotificationItem } from "@/lib/notifications/ui";
import type { UserStorageUsage } from "@/lib/storage/usage";
import { cn } from "@/lib/utils";
import { zLayer } from "@/lib/z-layers";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Project", href: "/projects", icon: FolderOpen },
  { label: "Riwayat render", href: "/renders", icon: ImageIcon },
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
    return (
      <>
        <span
          className={cn(
            "block min-w-0 truncate transition-[opacity,transform] duration-150 ease-out",
            expanded
              ? "translate-x-0 opacity-100"
              : "pointer-events-none w-0 -translate-x-1 overflow-hidden opacity-0",
          )}
        >
          {label}
        </span>
        {!expanded && (
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-elevated group-hover:block">
            {label}
          </span>
        )}
      </>
    );
  }

  function renderSidebar(forceExpanded = false) {
    const expanded = forceExpanded || effectiveExpanded;

    return (
      <aside
        onClick={(e) => openCollapsedSidebarFromEmptyArea(e, expanded)}
        className={cn(
          "flex h-full flex-col overflow-visible border-r border-border/75 bg-card transition-[width] duration-300 ease-out",
          expanded ? "w-60" : "w-[72px]",
        )}
        suppressHydrationWarning
      >
        <div className="relative h-14 border-b border-border/75">
          <Link
            href="/dashboard"
            aria-label="RenderAI dashboard"
            onClick={() => setOpen(false)}
            className={cn(
              "absolute left-8 top-1/2 min-w-0 -translate-y-1/2 whitespace-nowrap text-base font-extrabold tracking-normal text-foreground transition-opacity duration-150 ease-out",
              expanded
                ? "opacity-100 delay-100"
                : "pointer-events-none opacity-0",
            )}
          >
            RenderAI<span className="text-primary">.</span>
          </Link>
          <button
            type="button"
            className={cn(
              "absolute left-1/2 top-1/2 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-[opacity,background-color,color] duration-150 ease-out hover:bg-muted/80 hover:text-primary lg:flex",
              expanded
                ? "pointer-events-none opacity-0"
                : "opacity-100 delay-100",
            )}
            onClick={() => updateSidebarExpanded(true)}
            aria-label="Lebarkan sidebar"
            title="Lebarkan sidebar"
          >
            <PanelLeft className="size-5" />
          </button>
          <div
            className={cn(
              "absolute inset-y-0 right-3 flex min-w-0 items-center justify-end gap-1.5 transition-opacity duration-150 ease-out",
              expanded
                ? "opacity-100 delay-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <button
              className="shrink-0 text-muted-foreground lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted/80 hover:text-primary lg:flex"
              onClick={() => updateSidebarExpanded(false)}
              aria-label="Ciutkan sidebar"
              title="Ciutkan sidebar"
            >
              <PanelLeft className="size-5" />
            </button>
          </div>
        </div>

        <div className={cn("space-y-1 px-3 pt-3", expanded ? "pb-0.5" : "pb-1")}>
          <Link
            href="/renders/new"
            onClick={() => setOpen(false)}
            title={!expanded ? "Buat render" : undefined}
            className={cn(
              "group relative grid grid-cols-[48px_minmax(0,1fr)] items-center rounded-md py-2 text-sm font-medium transition-colors",
              renderNewActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-primary hover:bg-accent/80",
            )}
          >
            <Plus className="mx-auto size-4 shrink-0" />
            {labelWithTooltip("Buat render", expanded)}
          </Link>
          <GlobalSearchCommand
            expanded={expanded}
            onNavigate={() => setOpen(false)}
          />
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
                  "group relative grid grid-cols-[48px_minmax(0,1fr)] items-center rounded-md py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <item.icon className="mx-auto size-4 shrink-0" />
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
                  "group relative grid grid-cols-[48px_minmax(0,1fr)] items-center rounded-md py-2 text-sm font-medium transition-colors",
                  isActive("/admin") && !isActive("/admin/audit")
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <Shield className="mx-auto size-4 shrink-0" />
                {labelWithTooltip("Admin", expanded)}
              </Link>
              <Link
                href="/admin/audit"
                onClick={() => setOpen(false)}
                title={!expanded ? "Log Audit" : undefined}
                className={cn(
                  "group relative grid grid-cols-[48px_minmax(0,1fr)] items-center rounded-md py-2 text-sm font-medium transition-colors",
                  isActive("/admin/audit")
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <ClipboardList className="mx-auto size-4 shrink-0" />
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
      {/* Desktop sidebar — fully hidden in the focused Render Studio. */}
      <div
        className={cn(
          "hidden transition-[width] duration-300 ease-out lg:fixed lg:inset-y-0 lg:left-0",
          zLayer.sidebar,
          renderNewActive ? "lg:hidden" : "lg:block",
          effectiveExpanded ? "lg:w-60" : "lg:w-[72px]",
        )}
        suppressHydrationWarning
      >
        {renderSidebar()}
      </div>

      {/* Mobile drawer */}
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 transition-[visibility] duration-0 lg:hidden",
          open
            ? "visible delay-0"
            : "pointer-events-none invisible delay-300",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-overlay/45 backdrop-blur-[2px] transition-opacity duration-200 ease-out",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {renderSidebar(true)}
        </div>
      </div>

      <div
        className={cn(
          "transition-[padding] duration-300 ease-out",
          renderNewActive
            ? "lg:pl-0"
            : effectiveExpanded
              ? "lg:pl-60"
              : "lg:pl-[72px]",
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
