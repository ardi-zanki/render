"use client";

import {
  Archive,
  Download,
  Loader2,
  MoreVertical,
  RotateCcw,
  Share2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Popover } from "@/components/ui/popover";
import { apiErrorMessage, apiJson, jsonInit, postJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ConfirmKind = "archive" | "restore" | "delete" | null;
type DownloadTokenResponse = { url: string };
type ShareResponse = { url: string };

const itemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

/**
 * Overflow (⋮) menu for a render's secondary actions — share, download,
 * archive/restore, delete. The primary "Open Studio" action lives outside this
 * menu so the detail page stays focused on the result.
 */
export function RenderActionsMenu({
  renderId,
  renderName,
  archived,
  canDownload,
}: {
  renderId: string;
  renderName: string;
  archived: boolean;
  canDownload: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
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
      toast.error(apiErrorMessage(err, "Unduh belum tersedia"));
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
      try {
        await navigator.clipboard.writeText(json.url);
        toast.success("Tautan disalin");
      } catch {
        toast.success(`Tautan: ${json.url}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal membuat tautan"));
    } finally {
      setSharing(false);
    }
  }

  function runFromMenu(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <>
      <Button
        ref={menuRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Aksi lainnya"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreVertical />
      </Button>

      <Popover
        anchorRef={menuRef}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        width={200}
        mobileFullWidth={false}
        align="end"
        className="rounded-lg border border-border/80 bg-popover p-1.5 shadow-elevated"
      >
        <button
          type="button"
          className={itemClass}
          disabled={!canDownload || sharing}
          onClick={() => runFromMenu(share)}
        >
          {sharing ? <Loader2 className="animate-spin" /> : <Share2 />} Bagikan
        </button>
        <button
          type="button"
          className={itemClass}
          disabled={!canDownload || downloading}
          onClick={() => runFromMenu(download)}
        >
          {downloading ? <Loader2 className="animate-spin" /> : <Download />}{" "}
          Unduh
        </button>
        {archived ? (
          <button
            type="button"
            className={itemClass}
            onClick={() => runFromMenu(() => setConfirm("restore"))}
          >
            <RotateCcw /> Pulihkan
          </button>
        ) : (
          <button
            type="button"
            className={itemClass}
            onClick={() => runFromMenu(() => setConfirm("archive"))}
          >
            <Archive /> Arsipkan
          </button>
        )}
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          className={cn(itemClass, "text-destructive [&_svg]:text-destructive")}
          onClick={() =>
            runFromMenu(() => {
              setDeleteConfirmation("");
              setConfirm("delete");
            })
          }
        >
          <Trash2 /> Hapus
        </button>
      </Popover>

      {confirm && confirm !== "delete" && (
        <ConfirmDialog
          title={confirm === "archive" ? "Arsipkan render?" : "Pulihkan render?"}
          description={
            confirm === "archive"
              ? "Render akan disembunyikan dari daftar utama. File tetap tersimpan."
              : "Render akan dikembalikan ke daftar utama."
          }
          confirmLabel={confirm === "archive" ? "Arsipkan" : "Pulihkan"}
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
    </>
  );
}
