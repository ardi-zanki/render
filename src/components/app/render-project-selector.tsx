"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Popover } from "@/components/ui/popover";
import { apiErrorMessage, apiJson, jsonInit } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ProjectOption = {
  id: string;
  name: string;
};

type MoveProjectResponse = {
  projectId: string;
  projectName: string;
};

export function RenderProjectSelector({
  renderId,
  currentProjectId,
  currentProjectName,
  projects,
}: {
  renderId: string;
  currentProjectId: string;
  currentProjectName: string;
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeProject = useMemo(
    () => ({
      id: currentProjectId,
      name: currentProjectName,
    }),
    [currentProjectId, currentProjectName],
  );
  const [movedProject, setMovedProject] = useState<ProjectOption | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [pendingProject, setPendingProject] = useState<ProjectOption | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const displayedProject = movedProject ?? activeProject;

  const normalizedProjects = useMemo(() => {
    if (projects.some((project) => project.id === displayedProject.id)) {
      return projects;
    }
    return [displayedProject, ...projects];
  }, [displayedProject, projects]);
  const selectedProject =
    normalizedProjects.find((project) => project.id === selectedProjectId) ??
    displayedProject;
  const disabled = normalizedProjects.length <= 1 || saving;

  function closeConfirm() {
    if (saving) return;
    setPendingProject(null);
    setSelectedProjectId(displayedProject.id);
  }

  async function saveProjectMove() {
    if (!pendingProject) return;
    setSaving(true);
    try {
      const response = await apiJson<MoveProjectResponse>(
        `/api/renders/${renderId}`,
        jsonInit({ targetProjectId: pendingProject.id }, { method: "PATCH" }),
      );
      setMovedProject({
        id: response.projectId,
        name: response.projectName,
      });
      setSelectedProjectId(response.projectId);
      setPendingProject(null);
      toast.success("Project render diperbarui");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal memindahkan render"));
      setSelectedProjectId(displayedProject.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <div className="w-[128px] min-w-0">
          <button
            ref={triggerRef}
            type="button"
            aria-label="Pindah project render"
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-7 w-full min-w-0 items-center justify-end gap-1 rounded-md border border-input bg-card pl-2 pr-1.5 text-right text-xs font-medium text-foreground shadow-hairline transition-colors hover:bg-muted/60 focus-visible:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="min-w-0 truncate">{selectedProject.name}</span>
            {saving ? (
              <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <Popover
        anchorRef={triggerRef}
        open={open}
        onClose={() => setOpen(false)}
        width={176}
        placement="auto"
        align="end"
        gap={6}
        mobileFullWidth={false}
        className="max-h-[176px] overflow-y-auto rounded-lg border border-border/80 bg-popover p-1 shadow-elevated"
      >
        <div role="listbox" aria-label="Pilih project render" className="space-y-0.5">
          {normalizedProjects.map((project) => {
            const active = project.id === displayedProject.id;
            return (
              <button
                key={project.id}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted/80",
                  active && "bg-muted/70",
                )}
                onClick={() => {
                  setOpen(false);
                  if (project.id === displayedProject.id) {
                    setSelectedProjectId(displayedProject.id);
                    return;
                  }
                  setSelectedProjectId(project.id);
                  setPendingProject(project);
                }}
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="min-w-0 truncate">{project.name}</span>
              </button>
            );
          })}
        </div>
      </Popover>

      {pendingProject && (
        <Modal
          onClose={closeConfirm}
          labelledBy="move-render-project-title"
          closeOnBackdrop={!saving}
          panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2
            id="move-render-project-title"
            className="text-base font-semibold text-foreground"
          >
            Pindahkan project?
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Render akan dipindahkan dari {displayedProject.name} ke{" "}
            {pendingProject.name}.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={closeConfirm} disabled={saving}>
              Batal
            </Button>
            <Button onClick={saveProjectMove} disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Simpan
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
