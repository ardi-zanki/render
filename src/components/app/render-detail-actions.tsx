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
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

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
  const [deleting, setDeleting] = useState(false);
  const [deleteNote, setDeleteNote] = useState("");

  async function mutate(kind: Exclude<ConfirmKind, null>, note?: string) {
    const endpoint =
      kind === "delete"
        ? `/api/renders/${renderId}`
        : `/api/renders/${renderId}/${kind}`;
    const res = await fetch(endpoint, {
      method: kind === "delete" ? "DELETE" : "POST",
      ...(kind === "delete"
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ note }),
          }
        : {}),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Aksi gagal");
      return;
    }
    toast.success(
      kind === "delete"
        ? "Render dihapus"
        : kind === "archive"
          ? "Render diarsipkan"
          : "Render dipulihkan",
    );
    setConfirm(null);
    router.push(kind === "delete" ? "/renders" : `/renders/${renderId}`);
    router.refresh();
  }

  async function confirmDelete() {
    const note = deleteNote.trim();
    if (!note) return;
    setDeleting(true);
    try {
      await mutate("delete", note);
    } finally {
      setDeleting(false);
    }
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
          onClick={() => {
            setDeleteNote("");
            setConfirm("delete");
          }}
          className={actionClass}
        >
          <Trash2 /> Hapus
        </Button>
      </div>

      {confirm && confirm !== "delete" && (
        <ConfirmDialog
          title={
            confirm === "archive" ? "Arsipkan render?" : "Pulihkan render?"
          }
          description={
            confirm === "archive"
              ? "Render akan disembunyikan dari daftar utama. File tetap tersimpan."
              : "Render akan dikembalikan ke daftar utama."
          }
          confirmLabel={
            confirm === "archive" ? "Arsipkan" : "Pulihkan"
          }
          destructive={false}
          onConfirm={() => mutate(confirm)}
          onClose={() => setConfirm(null)}
        />
      )}

      {confirm === "delete" && (
        <Modal
          onClose={() => {
            if (!deleting) setConfirm(null);
          }}
          labelledBy="delete-render-title"
          closeOnBackdrop={!deleting}
          panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2
            id="delete-render-title"
            className="text-base font-semibold text-foreground"
          >
            Hapus render?
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            File asli, hasil render, dan hasil edit yang terkait akan dihapus dan
            tidak bisa dikembalikan. Isi catatan sebelum menghapus.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            <label
              htmlFor="delete-render-note"
              className="text-sm font-medium text-foreground"
            >
              Catatan
            </label>
            <Textarea
              id="delete-render-note"
              value={deleteNote}
              onChange={(event) => setDeleteNote(event.target.value)}
              placeholder="Contoh: file gagal render dan tidak diperlukan lagi"
              maxLength={500}
              className="min-h-24"
              disabled={deleting}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting || !deleteNote.trim()}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Hapus
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
