"use client";

import {
  Monitor,
  Palette,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  PasswordForm,
  PreferencesForm,
  ProfileForm,
} from "@/components/app/settings-forms";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SettingsUser = { name: string; email: string; image?: string | null };
type SettingsPreferences = {
  displayName: string;
  emailNotificationsEnabled: boolean;
  defaultRenderMode: string;
  defaultOutputFormat: string;
};

type SettingsTab = "profile" | "preferences" | "security";

const TABS: Array<{
  value: SettingsTab;
  label: string;
  icon: typeof UserRound;
}> = [
  { value: "profile", label: "Profil", icon: UserRound },
  { value: "preferences", label: "Preferensi", icon: Palette },
  { value: "security", label: "Keamanan", icon: ShieldCheck },
];

export function SettingsModal({
  user,
  preferences,
  onClose,
}: {
  user: SettingsUser;
  preferences: SettingsPreferences;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483000] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <section className="relative z-[2147483001] flex h-[min(720px,calc(100vh-1.5rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:grid md:grid-cols-[220px_1fr]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Tutup pengaturan"
        >
          <X className="size-5" />
        </button>

        <aside className="border-b border-border bg-muted/35 p-3 pr-12 md:border-b-0 md:border-r">
          <div className="px-2 py-1 md:mb-4">
            <h2 id="settings-title" className="text-base font-bold text-foreground">
              Pengaturan
            </h2>
          </div>

          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          {activeTab === "profile" && (
            <div className="mx-auto flex max-w-xl flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Profil</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kelola informasi akun dan identitas yang tampil di aplikasi.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
                <Avatar name={user.name} src={user.image} size={64} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    Foto profil
                  </Badge>
                </div>
              </div>

              <ProfileForm
                name={user.name}
                displayName={preferences.displayName}
                email={user.email}
              />
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="mx-auto flex max-w-xl flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Preferensi
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Atur tampilan, tema, notifikasi, dan default render.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  id="theme"
                  value={theme ?? "system"}
                  onChange={(event) =>
                    setTheme(event.target.value as Theme)
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </div>

              <PreferencesForm
                emailNotificationsEnabled={
                  preferences.emailNotificationsEnabled
                }
                defaultRenderMode={preferences.defaultRenderMode}
                defaultOutputFormat={preferences.defaultOutputFormat}
              />
            </div>
          )}

          {activeTab === "security" && (
            <div className="mx-auto flex max-w-xl flex-col gap-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">Keamanan</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ubah password dan tinjau sesi login aktif.
                </p>
              </div>

              <PasswordForm />

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <Monitor className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      Sesi login saat ini
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Akun ini sedang aktif di perangkat yang Anda gunakan.
                    </p>
                  </div>
                  <Badge variant="success">Aktif</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
