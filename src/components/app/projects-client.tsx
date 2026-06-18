"use client";

import {
  Archive,
  FolderOpen,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { DebouncedSearchInput } from "@/components/app/debounced-search-input";
import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Popover } from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveProjectAction,
  createProjectAction,
  deleteProjectAction,
  unarchiveProjectAction,
  updateProjectAction,
} from "@/app/(app)/projects/actions";
import { zodFieldErrors } from "@/lib/form";
import { cn } from "@/lib/utils";
import { createProjectSchema } from "@/lib/validations/render";

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
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSave() {
    const parsed = createProjectSchema.safeParse({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      setFormError("");
      return;
    }
    setLoading(true);
    setErrors({});
    setFormError("");
    const desc = parsed.data.description;
    const res = isEdit
      ? await updateProjectAction(state.project!.id, parsed.data.name, desc)
      : await createProjectAction({ name: parsed.data.name, description: desc });
    setLoading(false);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    toast.success(isEdit ? "Project diperbarui" : "Project dibuat");
    onClose();
    router.refresh();
  }

  return (
    <Modal
      onClose={onClose}
      labelledBy="project-modal-title"
      panelClassName="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-dialog"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="project-modal-title"
          className="text-base font-semibold text-foreground"
        >
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
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-name">Nama</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Nama project"
            maxLength={80}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="project-desc">Deskripsi</Label>
          <Textarea
            id="project-desc"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder="Opsional"
            maxLength={500}
            className="min-h-20"
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
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
    </Modal>
  );
}

const menuItem =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

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
  query,
}: {
  projects: ProjectRow[];
  status: "active" | "archived";
  query: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const activeProject = menuId
    ? (projects.find((p) => p.id === menuId) ?? null)
    : null;

  function setTab(s: "active" | "archived") {
    const params = new URLSearchParams();
    if (s === "archived") params.set("status", "archived");
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `/projects?${qs}` : "/projects");
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

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          options={[
            { value: "active", label: "Aktif" },
            { value: "archived", label: "Arsip" },
          ]}
          value={status}
          onChange={setTab}
        />
        <div className="flex min-w-0 gap-2">
          <DebouncedSearchInput value={query} placeholder="Cari project..." />
          <Button onClick={() => setModal({ mode: "create" })} className="shrink-0">
            <Plus /> Buat project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={
            query
              ? "Project tidak ditemukan"
              : status === "archived"
                ? "Belum ada project diarsip"
                : "Belum ada project"
          }
          description={
            query ? "Coba kata kunci lain." : "Buat project untuk mulai."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="relative">
              <Link href={`/projects/${p.id}`}>
                <Card className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary/35">
                  <div className="relative aspect-video bg-muted">
                    {p.coverImageUrl ? (
                      <RenderImage
                        src={p.coverImageUrl}
                        alt={p.name}
                        className="absolute inset-0 size-full"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <FolderOpen className="size-7 text-muted-foreground" />
                      </div>
                    )}
                    {p.isDefault && (
                      <Badge
                        variant="secondary"
                        className="absolute left-2 top-2 bg-card/95 shadow-soft"
                      >
                        Default
                      </Badge>
                    )}
                  </div>
                  <CardContent className="py-3.5">
                    <p className="truncate font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.renderCount} render · {dateFmt.format(new Date(p.updatedAt))}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <div className="absolute right-2 top-2">
                <button
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setMenuId(menuId === p.id ? null : p.id);
                  }}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-foreground transition-colors hover:bg-card/90 focus-visible:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  aria-label="Menu project"
                  aria-haspopup="menu"
                  aria-expanded={menuId === p.id}
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeProject && (
        <Popover
          anchorRef={triggerRef}
          open
          onClose={() => setMenuId(null)}
          width={200}
          mobileFullWidth={false}
          className="rounded-lg border border-border/80 bg-popover p-1.5 shadow-elevated"
        >
          <button
            className={menuItem}
            onClick={() => {
              setModal({ mode: "edit", project: activeProject });
              setMenuId(null);
            }}
          >
            <Pencil /> Rename
          </button>
          {status === "active" ? (
            !activeProject.isDefault && (
              <button
                className={menuItem}
                onClick={() => {
                  setConfirm({ kind: "archive", project: activeProject });
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
                setConfirm({ kind: "unarchive", project: activeProject });
                setMenuId(null);
              }}
            >
              <RotateCcw /> Pulihkan
            </button>
          )}
          {!activeProject.isDefault && (
            <>
              <div className="my-1 h-px bg-border" />
              <button
                className={cn(
                  menuItem,
                  "text-destructive [&_svg]:text-destructive",
                )}
                onClick={() => {
                  setConfirm({ kind: "delete", project: activeProject });
                  setMenuId(null);
                }}
                disabled={activeProject.renderCount > 0}
                title={
                  activeProject.renderCount > 0
                    ? "Tidak bisa dihapus karena ada render"
                    : undefined
                }
              >
                <Trash2 /> Hapus
              </button>
            </>
          )}
        </Popover>
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
