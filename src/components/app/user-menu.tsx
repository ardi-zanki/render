"use client";

import {
  Gem,
  Loader2,
  LogOut,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ProfileModal } from "@/components/app/profile-modal";
import { SettingsModal } from "@/components/app/settings-modal";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const WA_SUPPORT = "https://wa.me/6200012340001";

type MenuUser = { name: string; email: string; image?: string | null };
type MenuPreferences = {
  displayName: string;
  emailNotificationsEnabled: boolean;
  defaultRenderMode: string;
  defaultOutputFormat: string;
};

const itemClass =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function UserMenu({
  user,
  preferences,
  compact = false,
}: {
  user: MenuUser;
  preferences: MenuPreferences;
  compact?: boolean;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const updateMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = 288;
    const left = compact ? rect.left + 8 : rect.left;
    setMenuPosition({
      left: Math.max(12, Math.min(left, window.innerWidth - width - 12)),
      bottom: Math.max(window.innerHeight - rect.top + 8, 12),
    });
  }, [compact]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(updateMenuPosition, 0);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // ignore - proceed to clear + redirect regardless
    }
    try {
      localStorage.clear();
      document.cookie =
        "renderai_sidebar_expanded=; path=/; max-age=0; samesite=lax";
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          updateMenuPosition();
          setOpen((o) => !o);
        }}
        title={compact ? user.name : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted",
          compact && "justify-center px-0",
        )}
      >
        <Avatar name={user.name} src={user.image} />
        <div className={cn("min-w-0 flex-1 text-left", compact && "hidden")}>
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        {compact && (
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg group-hover:block">
            Akun
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[2147481900]"
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                left: menuPosition?.left ?? 12,
                bottom: menuPosition?.bottom ?? 84,
              }}
              className="fixed z-[2147482000] max-h-[min(520px,calc(100vh-2rem))] w-72 overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-[0_16px_48px_rgb(15_23_42/0.14)]"
            >
            <div className="flex items-center gap-3 px-2.5 py-2">
              <Avatar name={user.name} src={user.image} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">Free</p>
              </div>
            </div>

            <div className="my-1 h-px bg-border" />

            <button
              type="button"
              onClick={() => {
                router.push("/payments");
                setOpen(false);
              }}
              className={itemClass}
            >
              <Gem /> Top up
            </button>
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setProfileOpen(true);
                setOpen(false);
              }}
            >
              <UserRound /> Profil
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
                setOpen(false);
              }}
              className={itemClass}
            >
              <Settings /> Pengaturan
            </button>
            <a
              href={WA_SUPPORT}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <MessageCircle /> Support
            </a>
            <div className="my-1 h-px bg-border" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className={itemClass}
            >
              {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
              Keluar
            </button>
          </div>
          </>,
          document.body,
        )}

      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}
      {settingsOpen && (
        <SettingsModal
          user={user}
          preferences={preferences}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
