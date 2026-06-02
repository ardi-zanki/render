"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";

/**
 * Interactive profile avatar with click-to-upload. Posts the new image (plus
 * the current name, which the endpoint requires) to /api/account/profile and
 * refreshes. Used inside the Settings modal's Profil tab.
 */
export function AvatarUpload({
  name,
  image,
}: {
  name: string;
  image?: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(image ?? null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    const fd = new FormData();
    fd.append("name", name);
    fd.append("avatar", file);
    const res = await fetch("/api/account/profile", {
      method: "POST",
      body: fd,
    });
    const json = await res.json().catch(() => ({}));
    setUploading(false);
    URL.revokeObjectURL(localPreview);
    if (!res.ok) {
      setPreview(image ?? null);
      toast.error(json.error ?? "Gagal memperbarui foto profil");
      return;
    }
    setPreview(json.image ?? null);
    toast.success("Foto profil diperbarui");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label="Ubah foto profil"
      >
        <Avatar name={name} src={preview} size={64} />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-foreground text-background">
          {uploading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Camera className="size-3" />
          )}
        </span>
      </button>
      <div className="min-w-0">
        <p className="font-semibold text-foreground">Foto profil</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          JPG, PNG, atau WebP · maks 5MB.
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
    </div>
  );
}
