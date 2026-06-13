"use client";

import {
  AlertTriangle,
  HardDrive,
  Loader2,
  Monitor,
  Palette,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  PasswordForm,
  PreferencesForm,
  ProfileForm,
} from "@/components/app/settings-forms";
import { useTheme, type Theme } from "@/components/theme-provider";
import { AvatarUpload } from "@/components/app/avatar-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { apiErrorMessage, apiJson } from "@/lib/client-api";
import type {
  StorageUsageCategory,
  UserStorageUsage,
} from "@/lib/storage/usage";
import { cn } from "@/lib/utils";

type SettingsUser = {
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};
type SettingsPreferences = {
  displayName: string;
  defaultRenderMode: string;
  defaultOutputFormat: string;
};

type SettingsTab = "profile" | "preferences" | "storage" | "security";
type ClearStorageResponse = {
  deletedAssets: number;
  deletedRenders: number;
  usage: UserStorageUsage;
};

const TABS: Array<{
  value: SettingsTab;
  label: string;
  icon: typeof UserRound;
}> = [
  { value: "profile", label: "Profil", icon: UserRound },
  { value: "preferences", label: "Preferensi", icon: Palette },
  { value: "storage", label: "Storage", icon: HardDrive },
  { value: "security", label: "Keamanan", icon: ShieldCheck },
];

const CATEGORY_LABELS: Record<StorageUsageCategory["type"], string> = {
  original: "File mentahan",
  reference: "File referensi",
  result: "Hasil render",
  edit: "Hasil edit",
  upscale: "Hasil upscale",
  mask: "Mask seleksi",
};

const DELETE_CONFIRM_TEXT = "HAPUS STORAGE";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unitIndex]}`;
}

export function SettingsModal({
  user,
  preferences,
  googleConnected,
  storageUsage,
  onClose,
}: {
  user: SettingsUser;
  preferences: SettingsPreferences;
  googleConnected: boolean;
  storageUsage: UserStorageUsage;
  onClose: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [usage, setUsage] = useState(storageUsage);
  const [refreshingStorage, setRefreshingStorage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deletingStorage, setDeletingStorage] = useState(false);
  const [storageError, setStorageError] = useState("");
  const { theme, setTheme } = useTheme();
  const usagePercent = usage.limitBytes
    ? Math.min(100, Math.round((usage.usedBytes / usage.limitBytes) * 100))
    : 0;

  async function refreshStorage() {
    setRefreshingStorage(true);
    setStorageError("");
    try {
      const json = await apiJson<UserStorageUsage>("/api/account/storage", {
        cache: "no-store",
      });
      setUsage(json);
    } catch (err) {
      setStorageError(apiErrorMessage(err, "Gagal memuat storage"));
    } finally {
      setRefreshingStorage(false);
    }
  }

  async function removeAllStorage() {
    setDeletingStorage(true);
    setStorageError("");
    try {
      const json = await apiJson<ClearStorageResponse>("/api/account/storage", {
        method: "DELETE",
      });
      setUsage(json.usage);
      setDeleteOpen(false);
      setDeleteText("");
      toast.success("Storage render dikosongkan");
      router.refresh();
    } catch (err) {
      setStorageError(apiErrorMessage(err, "Gagal menghapus storage"));
    } finally {
      setDeletingStorage(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="settings-title"
      containerClassName="p-3 sm:p-6"
      panelClassName="flex h-[min(680px,calc(100vh-1.5rem))] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-dialog md:grid md:grid-cols-[196px_1fr]"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Tutup pengaturan"
      >
        <X className="size-5" />
      </button>

      <aside className="border-b border-border bg-muted/35 p-3 pr-12 md:border-b-0 md:border-r md:pr-3">
        <div className="px-2 py-1 md:mb-4">
          <h2 id="settings-title" className="text-base font-semibold text-foreground">
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
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "bg-card text-primary shadow-soft"
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

      <div className="min-h-0 overflow-y-auto p-5">
        {activeTab === "profile" && (
          <div className="mx-auto flex max-w-xl flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Profil</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola informasi akun dan identitas yang tampil di aplikasi.
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-background/60 p-4">
              <AvatarUpload name={user.name} image={user.image} />
            </div>

            <ProfileForm
              name={user.name}
              displayName={preferences.displayName}
              email={user.email}
              emailVerified={user.emailVerified}
            />
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="mx-auto flex max-w-xl flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Preferensi</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Atur tampilan, tema, notifikasi, dan default render.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="theme">Tema</Label>
              <Select
                id="theme"
                value={theme ?? "system"}
                onChange={(event) => setTheme(event.target.value as Theme)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </Select>
            </div>

            <PreferencesForm
              defaultRenderMode={preferences.defaultRenderMode}
              defaultOutputFormat={preferences.defaultOutputFormat}
            />
          </div>
        )}

        {activeTab === "security" && (
          <div className="mx-auto flex max-w-xl flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Keamanan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ubah password dan tinjau sesi login aktif.
              </p>
            </div>

            <PasswordForm />

            <div className="rounded-lg border border-border/80 bg-background/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
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

            <div className="rounded-lg border border-border/80 bg-background/60 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
                  G
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">Akun Google</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {googleConnected
                      ? "Akun Google Anda terhubung untuk login cepat."
                      : "Belum terhubung. Anda login dengan email dan password."}
                  </p>
                </div>
                <Badge variant={googleConnected ? "success" : "secondary"}>
                  {googleConnected ? "Terhubung" : "Belum"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {activeTab === "storage" && (
          <div className="mx-auto flex max-w-xl flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Storage</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pantau kapasitas file mentahan, referensi, hasil render, hasil edit, dan mask seleksi.
              </p>
            </div>

            {storageError && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertDescription>{storageError}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border border-border/80 bg-background/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatBytes(usage.usedBytes)} dari{" "}
                    {formatBytes(usage.limitBytes)} terpakai
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {usage.assetCount} file render tersimpan
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshStorage}
                  disabled={refreshingStorage}
                >
                  {refreshingStorage ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                  Refresh
                </Button>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    usagePercent >= 90 ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {usagePercent}% digunakan
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-background/60">
              {usage.categories.map((category, index) => (
                <div
                  key={category.type}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-3",
                    index > 0 && "border-t border-border/80",
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {CATEGORY_LABELS[category.type]}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {category.count} file
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatBytes(category.bytes)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-destructive">
                    Hapus semua storage
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Menghapus semua file mentahan, referensi, hasil render, dan
                    hasil edit milik akun ini. Render terkait akan hilang dari riwayat.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDeleteOpen(true);
                    setDeleteText("");
                  }}
                  disabled={usage.assetCount === 0}
                >
                  <Trash2 /> Hapus semua
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {deleteOpen && (
        <Modal
          onClose={() => {
            if (!deletingStorage) setDeleteOpen(false);
          }}
          labelledBy="delete-storage-title"
          closeOnBackdrop={!deletingStorage}
          panelClassName="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h3
            id="delete-storage-title"
            className="text-base font-semibold text-foreground"
          >
            Hapus semua storage render?
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Catatan wajib: tindakan ini permanen. Semua file mentahan,
            referensi, hasil render, dan hasil edit akan dihapus dari storage
            dan render terkait tidak akan tampil lagi di riwayat.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="deleteStorageConfirm">
              Ketik {DELETE_CONFIRM_TEXT} untuk konfirmasi
            </Label>
            <Input
              id="deleteStorageConfirm"
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              disabled={deletingStorage}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deletingStorage}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={removeAllStorage}
              disabled={deletingStorage || deleteText !== DELETE_CONFIRM_TEXT}
            >
              {deletingStorage ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Hapus semua
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
