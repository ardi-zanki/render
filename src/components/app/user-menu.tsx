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
        onClick={() => setOpen((o) => !o)}
        title={compact ? user.name : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
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

      <Popover
        anchorRef={buttonRef}
        open={open}
        onClose={() => setOpen(false)}
        width={288}
        placement="top"
        align="start"
        alignOffset={compact ? 8 : 0}
        className="max-h-[min(520px,calc(100vh-2rem))] overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-[0_16px_48px_rgb(15_23_42/0.14)]"
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
      </Popover>

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
