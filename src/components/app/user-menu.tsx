"use client";

import {
  Gem,
  Loader2,
  LogOut,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProfileModal } from "@/components/app/profile-modal";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";

const WA_SUPPORT = "https://wa.me/6200012340001";

type MenuUser = { name: string; email: string; image?: string | null };

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function UserMenu({ user }: { user: MenuUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      // ignore — proceed to clear + redirect regardless
    }
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
      >
        <Avatar name={user.name} src={user.image} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
            <div className="flex items-center gap-3 px-2.5 py-2">
              <Avatar name={user.name} src={user.image} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="my-1 h-px bg-border" />

            <Link
              href="/payments"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Gem /> Topup Kredit
            </Link>
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
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <Settings /> Pengaturan Akun
            </Link>
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
        </>
      )}

      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
