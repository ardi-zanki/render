"use client";

import {
  Archive,
  FolderOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveProjectAction,
  createProjectAction,
  deleteProjectAction,
  unarchiveProjectAction,
  updateProjectAction,
} from "@/app/(app)/projects/actions";
import { cn } from "@/lib/utils";

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isDefault: boolean;
  updatedAt: string;
  renderCount: number;
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

type ModalState = { mode: "create" | "edit"; project?: ProjectRow } | null;
type ConfirmState = {
  kind: "archive" | "unarchive" | "delete";
  project: ProjectRow;
} | null;

function ProjectFormModal({
  state,
  onClose,
}: {
  state: NonNullable<ModalState>;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = state.mode === "edit";
  const [name, setName] = useState(state.project?.name ?? "");
  const [description, setDescription] = useState(
    state.project?.description ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSave() {
    if (!name.trim()) {
      setError("Nama project wajib diisi");
      return;
    }
    setLoading(true);
    setError("");
    const desc = description.trim() || undefined;
    const res = isEdit
      ? await updateProjectAction(state.project!.id, name.trim(), desc)
      : await createProjectAction({ name: name.trim(), description: desc });
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    toast.success(isEdit ? "Project diperbarui" : "Project dibuat");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-[61] w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-[0_20px_60px_rgb(24_33_31/0.16)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {isEdit ? "Edit project" : "Buat project"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Nama</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama project"
              maxLength={80}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-desc">Deskripsi</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opsional"
              maxLength={500}
              className="min-h-20"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isEdit ? "Simpan" : "Buat"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const menuItem =
  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

const CONFIRM_COPY = {
  archive: {
    title: "Arsipkan project?",
    confirmLabel: "Arsipkan",
    note: "akan diarsipkan. Render di dalamnya tetap tersimpan.",
    success: "Project diarsipkan",
  },
  unarchive: {
    title: "Pulihkan project?",
    confirmLabel: "Pulihkan",
    note: "akan dikembalikan ke daftar aktif.",
    success: "Project dipulihkan",
  },
  delete: {
    title: "Hapus project?",
    confirmLabel: "Hapus",
    note: "akan dihapus permanen.",
    success: "Project dihapus",
  },
} as const;

export function ProjectsClient({
  projects,
  status,
}: {
  projects: ProjectRow[];
  status: "active" | "archived";
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function setTab(s: "active" | "archived") {
    router.push(`/projects?status=${s}`);
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, project } = confirm;
    const action =
      kind === "archive"
        ? archiveProjectAction
        : kind === "unarchive"
          ? unarchiveProjectAction
          : deleteProjectAction;
    const res = await action(project.id);
    setConfirm(null);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(CONFIRM_COPY[kind].success);
    router.refresh();
  }

  const tabClass = (active: boolean) =>
    cn(
      "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-muted",
    );

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button className={tabClass(status === "active")} onClick={() => setTab("active")}>
            Aktif
          </button>
          <button
            className={tabClass(status === "archived")}
            onClick={() => setTab("archived")}
          >
            Arsip
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari project..."
              className="pl-9"
            />
          </div>
          <Button onClick={() => setModal({ mode: "create" })} className="shrink-0">
            <Plus /> Buat project
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={
            search
              ? "Project tidak ditemukan"
              : status === "archived"
                ? "Belum ada project diarsip"
                : "Belum ada project"
          }
          description={
            search ? "Coba kata kunci lain." : "Buat project untuk mulai."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="relative">
              <Link href={`/projects/${p.id}`}>
                <Card className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary/35">
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    {p.coverImageUrl ? (
                      <RenderImage
                        src={p.coverImageUrl}
                        alt={p.name}
                        className="size-full"
                      />
                    ) : (
                      <FolderOpen className="size-7 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="py-4">
                    <p className="flex items-center gap-2 truncate font-semibold text-foreground">
                      {p.name}
                      {p.isDefault && <Badge variant="secondary">Default</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.renderCount} render · {dateFmt.format(new Date(p.updatedAt))}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <div className="absolute right-2 top-2">
                <button
                  onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                  className="flex size-8 items-center justify-center rounded-md bg-card/90 text-foreground shadow-sm backdrop-blur hover:bg-card"
                  aria-label="Menu project"
                >
                  <MoreVertical className="size-4" />
                </button>
                {menuId === p.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuId(null)}
                    />
                    <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-[0_12px_32px_rgb(24_33_31/0.12)]">
                      <button
                        className={menuItem}
                        onClick={() => {
                          setModal({ mode: "edit", project: p });
                          setMenuId(null);
                        }}
                      >
                        <Pencil /> Rename
                      </button>
                      {status === "active" ? (
                        !p.isDefault && (
                          <button
                            className={menuItem}
                            onClick={() => {
                              setConfirm({ kind: "archive", project: p });
                              setMenuId(null);
                            }}
                          >
                            <Archive /> Arsipkan
                          </button>
                        )
                      ) : (
                        <button
                          className={menuItem}
                          onClick={() => {
                            setConfirm({ kind: "unarchive", project: p });
                            setMenuId(null);
                          }}
                        >
                          <RotateCcw /> Pulihkan
                        </button>
                      )}
                      {!p.isDefault && (
                        <button
                          className={cn(
                            menuItem,
                            "text-destructive [&_svg]:text-destructive",
                          )}
                          onClick={() => {
                            setConfirm({ kind: "delete", project: p });
                            setMenuId(null);
                          }}
                          disabled={p.renderCount > 0}
                          title={
                            p.renderCount > 0
                              ? "Tidak bisa dihapus karena ada render"
                              : undefined
                          }
                        >
                          <Trash2 /> Hapus
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectFormModal state={modal} onClose={() => setModal(null)} />
      )}

      {confirm && (
        <ConfirmDialog
          title={CONFIRM_COPY[confirm.kind].title}
          description={`Project "${confirm.project.name}" ${CONFIRM_COPY[confirm.kind].note}`}
          confirmLabel={CONFIRM_COPY[confirm.kind].confirmLabel}
          destructive={confirm.kind === "delete"}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}
