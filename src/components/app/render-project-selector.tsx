"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { apiErrorMessage, apiJson, jsonInit } from "@/lib/client-api";

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
  const [saving, setSaving] = useState(false);

  const displayedProject = movedProject ?? activeProject;

  const normalizedProjects = useMemo(() => {
    if (projects.some((project) => project.id === displayedProject.id)) {
      return projects;
    }
    return [displayedProject, ...projects];
  }, [displayedProject, projects]);

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
        <Select
          aria-label="Pindah project render"
          value={selectedProjectId}
          onChange={(event) => {
            const nextProject = normalizedProjects.find(
              (project) => project.id === event.target.value,
            );
            if (!nextProject || nextProject.id === displayedProject.id) {
              setSelectedProjectId(displayedProject.id);
              return;
            }
            setSelectedProjectId(nextProject.id);
            setPendingProject(nextProject);
          }}
          disabled={normalizedProjects.length <= 1 || saving}
          className="h-8 max-w-[180px] truncate pr-8 text-right font-medium"
        >
          {normalizedProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
      </div>

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
