"use client";

import {
  Archive,
  Check,
  Download,
  Loader2,
  RotateCcw,
  Share2,
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
import { Input } from "@/components/ui/input";
import { apiErrorMessage, apiJson, jsonInit, postJson } from "@/lib/client-api";

type ConfirmKind = "archive" | "restore" | "delete" | null;
type DownloadTokenResponse = { url: string };
type ShareResponse = { url: string };

export function RenderDetailActions({
  renderId,
  projectId,
  renderName,
  prompt,
  archived,
  canDownload,
}: {
  renderId: string;
  projectId: string;
  renderName: string;
  prompt?: string | null;
  archived: boolean;
  canDownload: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  async function mutate(
    kind: Exclude<ConfirmKind, null>,
    confirmationName?: string,
  ) {
    const endpoint =
      kind === "delete"
        ? `/api/renders/${renderId}`
        : `/api/renders/${renderId}/${kind}`;
    try {
      await apiJson(endpoint, {
        method: kind === "delete" ? "DELETE" : "POST",
        ...(kind === "delete" ? jsonInit({ confirmationName }) : {}),
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, "Aksi gagal"));
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
    const confirmationName = deleteConfirmation.trim();
    if (confirmationName !== renderName) return;
    setDeleting(true);
    try {
      await mutate("delete", confirmationName);
    } finally {
      setDeleting(false);
    }
  }

  async function download() {
    setDownloading(true);
    try {
      const json = await apiJson<DownloadTokenResponse>(
        `/api/renders/${renderId}/download-token`,
        { method: "POST" },
      );
      window.location.href = json.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Download belum tersedia"));
    } finally {
      setDownloading(false);
    }
  }

  async function share() {
    setSharing(true);
    try {
      const json = await postJson<ShareResponse>("/api/renders/share", {
        renderId,
      });
      setShareUrl(json.url);
      try {
        await navigator.clipboard.writeText(json.url);
        toast.success("Link share disalin");
      } catch {
        toast.success("Link share dibuat");
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal membuat link share"));
    } finally {
      setSharing(false);
    }
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
        <Button
          variant="outline"
          onClick={share}
          disabled={!canDownload || sharing}
          className={actionClass}
        >
          {sharing ? (
            <Loader2 className="animate-spin" />
          ) : shareUrl ? (
            <Check />
          ) : (
            <Share2 />
          )}
          {shareUrl ? "Tersalin" : "Bagikan"}
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
            setDeleteConfirmation("");
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
            tidak bisa dikembalikan. Ketik nama render secara manual sebelum
            menghapus.
          </p>
          <div className="mt-4 flex flex-col gap-1.5">
            <label
              htmlFor="delete-render-confirmation"
              className="text-sm font-medium text-foreground"
            >
              Ketik nama render
            </label>
            <Input
              id="delete-render-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={renderName}
              maxLength={120}
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
              disabled={deleting || deleteConfirmation.trim() !== renderName}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Hapus
            </Button>
          </div>
        </Modal>
      )}

      {shareUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
          <Share2 className="size-3.5 shrink-0 text-primary" />
          <span className="truncate font-mono text-muted-foreground">
            {shareUrl}
          </span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto shrink-0 font-medium text-primary hover:underline"
          >
            Buka
          </a>
        </div>
      )}
    </>
  );
}
