"use client";

import {
  Archive,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";

type ConfirmKind = "archive" | "restore" | "delete" | null;

export function RenderDetailActions({
  renderId,
  projectId,
  prompt,
  archived,
  canDownload,
}: {
  renderId: string;
  projectId: string;
  prompt?: string | null;
  archived: boolean;
  canDownload: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [downloading, setDownloading] = useState(false);

  async function mutate(kind: Exclude<ConfirmKind, null>) {
    const endpoint =
      kind === "delete"
        ? `/api/renders/${renderId}`
        : `/api/renders/${renderId}/${kind}`;
    const res = await fetch(endpoint, { method: kind === "delete" ? "DELETE" : "POST" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Aksi gagal");
      return;
    }
    toast.success(
      kind === "delete"
        ? "Render dihapus permanen"
        : kind === "archive"
          ? "Render diarsipkan"
          : "Render dipulihkan",
    );
    setConfirm(null);
    router.push(kind === "delete" ? "/renders" : `/renders/${renderId}`);
    router.refresh();
  }

  async function download() {
    setDownloading(true);
    const res = await fetch(`/api/renders/${renderId}/download-token`, {
      method: "POST",
    });
    const json = await res.json().catch(() => ({}));
    setDownloading(false);
    if (!res.ok || !json.url) {
      toast.error(json.error ?? "Download belum tersedia");
      return;
    }
    window.location.href = json.url;
  }

  const reuseHref = `/renders/new?project=${projectId}${
    prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""
  }`;

  const actionClass = "w-full justify-start";

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className={actionClass}>
          <Link href={reuseHref}>
            <Sparkles /> Reuse prompt
          </Link>
        </Button>
        <Button
          variant="inverse"
          onClick={download}
          disabled={!canDownload || downloading}
          className={actionClass}
        >
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          Download
        </Button>
        {archived ? (
          <Button
            variant="outline"
            onClick={() => setConfirm("restore")}
            className={actionClass}
          >
            <RotateCcw /> Pulihkan
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setConfirm("archive")}
            className={actionClass}
          >
            <Archive /> Arsipkan
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={() => setConfirm("delete")}
          className={actionClass}
        >
          <Trash2 /> Hapus permanen
        </Button>
      </div>

      {confirm && (
        <ConfirmDialog
          title={
            confirm === "delete"
              ? "Hapus render ini secara permanen?"
              : confirm === "archive"
                ? "Arsipkan render?"
                : "Pulihkan render?"
          }
          description={
            confirm === "delete"
              ? "File asli, hasil render, dan hasil edit yang terkait akan dihapus dan tidak bisa dikembalikan."
              : confirm === "archive"
                ? "Render akan disembunyikan dari daftar utama. File tetap tersimpan."
                : "Render akan dikembalikan ke daftar utama."
          }
          confirmLabel={
            confirm === "delete"
              ? "Hapus permanen"
              : confirm === "archive"
                ? "Arsipkan"
                : "Pulihkan"
          }
          destructive={confirm === "delete"}
          onConfirm={() => mutate(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}
