"use client";

import {
  Gem,
  Loader2,
  LogOut,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { SettingsModal } from "@/components/app/settings-modal";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { signOut } from "@/lib/auth-client";
import type { UserStorageUsage } from "@/lib/storage/usage";
import { cn } from "@/lib/utils";

type MenuUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};
type MenuPreferences = {
  displayName: string;
  defaultRenderMode: string;
  defaultOutputFormat: string;
};

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

const LOGOUT_MIN_FEEDBACK_MS = 850;

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function UserMenu({
  user,
  preferences,
  googleConnected,
  storageUsage,
  compact = false,
}: {
  user: MenuUser;
  preferences: MenuPreferences;
  googleConnected: boolean;
  storageUsage: UserStorageUsage;
  compact?: boolean;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    const startedAt = Date.now();
    setLoggingOut(true);
    setOpen(false);
    setSettingsOpen(false);
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
    const remainingFeedback = LOGOUT_MIN_FEEDBACK_MS - (Date.now() - startedAt);
    if (remainingFeedback > 0) await wait(remainingFeedback);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        title={compact ? user.name : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loggingOut}
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-md py-2 transition-colors hover:bg-muted/80",
          "disabled:cursor-wait disabled:opacity-80",
          compact ? "justify-center px-0" : "px-1",
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
          <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-elevated group-hover:block">
            Akun
          </span>
        )}
      </button>

      <Popover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        width={220}
        mobileFullWidth={false}
        placement="top"
        align="start"
        alignOffset={compact ? 8 : 0}
        className="max-h-[min(520px,calc(100vh-2rem))] overflow-y-auto rounded-lg border border-border/80 bg-popover p-1.5 shadow-elevated"
      >
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar name={user.name} src={user.image} size={32} />
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
          onClick={() => {
            setSettingsOpen(true);
            setOpen(false);
          }}
          className={itemClass}
        >
          <Settings /> Pengaturan
        </button>
        <button
          type="button"
          onClick={() => {
            router.push("/support");
            setOpen(false);
          }}
          className={itemClass}
        >
          <MessageCircle /> Support
        </button>
        <div className="my-1 h-px bg-border" />

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={itemClass}
        >
          {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </Popover>

      {loggingOut && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-dialog">
            <Loader2 className="size-4 animate-spin text-primary" />
            Keluar...
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          user={user}
          preferences={preferences}
          googleConnected={googleConnected}
          storageUsage={storageUsage}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
