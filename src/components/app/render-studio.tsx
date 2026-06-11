"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useRenderStatusPolling } from "@/hooks/use-render-status-polling";
import {
  apiErrorMessage,
  apiFieldErrors,
  apiJson,
  postJson,
} from "@/lib/client-api";
import { RenderActionBar } from "./render-studio/action-bar";
import { CreateProjectModal } from "./render-studio/create-project-modal";
import { RenderStudioControls } from "./render-studio/controls";
import { RenderPreviewViewer } from "./render-studio/preview-viewer";
import { StudioRenderInfo } from "./render-studio/render-info";
import { RenderSceneList } from "./render-studio/scene-list";
import { StudioVersionHistory } from "./render-studio/version-history";
import {
  type CreateProjectResponse,
  type CreateRenderResponse,
  type DownloadTokenResponse,
  type RenderStudioProps,
  type ShareResponse,
  type StudioVersion,
  type ViewerTab,
} from "./render-studio/types";
import { useRenderStudioState } from "./render-studio/use-render-studio-state";

export function RenderStudio({
  projectId,
  projectName,
  projects,
  initialBalance,
  initialScenes,
  defaultRenderMode = "interior",
  defaultOutputFormat = "jpg",
  initialInstruction = "",
  initialConfig = null,
  initialImageUrl = null,
  initialResultUrl = null,
  initialResultRenderId = null,
  sourceRenderId = null,
  initialVersions = [],
  renderInfo = null,
}: RenderStudioProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  // Iterative editing base: defaults to the latest version.
  const [selectedBaseAssetId, setSelectedBaseAssetId] = useState<string | null>(
    initialVersions[initialVersions.length - 1]?.id ?? null,
  );
  const { startPolling } = useRenderStatusPolling();
  const state = useRenderStudioState({
    defaultRenderMode,
    defaultOutputFormat,
    initialInstruction,
    initialBalance,
    initialScenes,
    initialConfig,
    initialImageUrl,
    initialResultUrl,
    initialResultRenderId,
  });

  function switchProject(id: string) {
    if (id !== projectId) router.push(`/renders/new?project=${id}`);
  }

  async function submitCreateProject() {
    const name = state.newProjectName.trim();
    if (!name) {
      state.setNewProjectErrors({ name: "Nama project wajib diisi" });
      return;
    }
    state.setCreatingProject(true);
    state.setNewProjectErrors({});
    try {
      const json = await postJson<CreateProjectResponse>("/api/projects", {
        name,
      });
      toast.success("Project dibuat");
      state.setCreateOpen(false);
      state.setNewProjectName("");
      state.setNewProjectErrors({});
      router.push(`/renders/new?project=${json.id}`);
    } catch (err) {
      const fieldErrors = apiFieldErrors(err);
      if (fieldErrors) state.setNewProjectErrors(fieldErrors);
      toast.error(apiErrorMessage(err, "Gagal membuat project"));
    } finally {
      state.setCreatingProject(false);
    }
  }

  async function onEdit() {
    if (!sourceRenderId) return;
    state.setLoading(true);
    state.setError("");
    try {
      const json = await postJson<CreateRenderResponse>(
        `/api/renders/${sourceRenderId}/edit`,
        {
          style: state.style,
          time: state.time,
          weather: state.weather,
          location: state.location || undefined,
          surrounding: state.surrounding,
          lightsOn: state.lightsOn,
          instruction: state.instruction || undefined,
          outputFormat: state.outputFormat,
          baseAssetId: selectedBaseAssetId ?? undefined,
        },
      );
      state.setRenderStatus(json.status ?? "queued");
      state.setResultRenderId(json.renderId);
      state.setBalance((balance) => json.balance ?? balance - 1);
      toast.success("Edit masuk antrean");
      startPolling(json.renderId, {
        onUpdate: (render) => state.setRenderStatus(render.status),
        onSuccess: (render) => {
          state.setResultUrl(render.resultUrl);
          state.setView("hasil");
          toast.success("Edit selesai!");
          router.refresh();
        },
        onFailure: (render) => {
          state.setError(
            render.errorMessage ?? "Edit gagal. Kredit sudah dikembalikan.",
          );
          router.refresh();
        },
        onTimeout: () => {
          state.setError("Edit masih diproses. Cek beberapa saat lagi.");
        },
      });
      router.refresh();
    } catch (err) {
      state.setError(
        apiErrorMessage(err, "Tidak bisa terhubung ke server. Coba lagi."),
      );
    } finally {
      state.setLoading(false);
    }
  }

  async function onRender() {
    if (sourceRenderId) return onEdit();
    if (!state.file) {
      state.setError("Upload gambar desain dulu ya.");
      return;
    }
    if (state.mode === "style_transfer" && !state.referenceFile) {
      state.setError("Upload reference image untuk Style Transfer.");
      return;
    }
    state.setLoading(true);
    state.setError("");
    try {
      const fd = new FormData();
      fd.append("image", state.file);
      fd.append("mode", state.mode);
      fd.append("projectId", projectId);
      fd.append("outputFormat", state.outputFormat);
      if (state.style !== "auto") fd.append("style", state.style);
      fd.append("time", state.time);
      if (state.mode !== "interior") fd.append("weather", state.weather);
      if (state.location) fd.append("location", state.location);
      if (state.surrounding !== "auto") {
        fd.append("surrounding", state.surrounding);
      }
      if (state.lightsOn) fd.append("lightsOn", "true");
      if (state.instruction) fd.append("instruction", state.instruction);
      if (state.referenceFile) {
        fd.append("reference", state.referenceFile);
        fd.append("styleTransferStrength", String(state.styleTransferStrength));
        if (state.negativePrompt.trim()) {
          fd.append("negativePrompt", state.negativePrompt.trim());
        }
      }

      const json = await apiJson<CreateRenderResponse>("/api/renders", {
        method: "POST",
        body: fd,
      });
      state.setResultUrl(null);
      state.setResultRenderId(json.renderId);
      state.setShareUrl(null);
      state.setRenderStatus(json.status ?? "queued");
      state.setBalance((balance) => json.balance ?? balance - 1);
      state.setScenes((scenes) => [
        { id: json.renderId, mode: state.mode, status: "queued", resultUrl: null },
        ...scenes,
      ]);
      toast.success("Render masuk antrean");
      startPolling(json.renderId, {
        onUpdate: (render) => {
          state.setRenderStatus(render.status);
          state.setScenes((items) =>
            items.map((item) =>
              item.id === json.renderId
                ? {
                    ...item,
                    status: render.status,
                    resultUrl: render.resultUrl,
                  }
                : item,
            ),
          );
        },
        onSuccess: (render) => {
          state.setResultUrl(render.resultUrl);
          state.setView("hasil");
          toast.success("Render selesai!");
          router.refresh();
        },
        onFailure: (render) => {
          state.setError(
            render.errorMessage ?? "Render gagal. Kredit sudah dikembalikan.",
          );
          router.refresh();
        },
        onTimeout: () => {
          state.setError(
            "Render masih diproses. Cek Riwayat Render beberapa saat lagi.",
          );
        },
      });
      router.refresh();
    } catch (err) {
      state.setError(
        apiErrorMessage(err, "Tidak bisa terhubung ke server. Coba lagi."),
      );
    } finally {
      state.setLoading(false);
    }
  }

  async function onShare() {
    if (!state.resultRenderId) return;
    state.setSharing(true);
    try {
      const json = await postJson<ShareResponse>("/api/renders/share", {
        renderId: state.resultRenderId,
      });
      state.setShareUrl(json.url);
      try {
        await navigator.clipboard.writeText(json.url);
      } catch {
        // clipboard may be unavailable; the link is shown below regardless.
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal membuat link share"));
    } finally {
      state.setSharing(false);
    }
  }

  async function onDownload() {
    if (!state.resultRenderId) return;
    state.setDownloading(true);
    try {
      const json = await apiJson<DownloadTokenResponse>(
        `/api/renders/${state.resultRenderId}/download-token`,
        { method: "POST" },
      );
      window.location.href = json.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Download belum tersedia"));
    } finally {
      state.setDownloading(false);
    }
  }

  // Scene History: load a version's config onto the controls + its image onto
  // the canvas, so the user can continue editing from that version.
  function loadVersion(version: StudioVersion) {
    setSelectedBaseAssetId(version.id);
    const cfg = version.config;
    state.setStyle(cfg?.style ?? "auto");
    state.setTime(cfg?.time ?? "auto");
    state.setWeather(cfg?.weather ?? "auto");
    state.setLightsOn(() => cfg?.lightsOn ?? false);
    state.setLocation(cfg?.location ?? "");
    state.setSurrounding(cfg?.surrounding ?? "auto");
    state.setInstruction(cfg?.instruction ?? "");
    state.setResultUrl(version.fileUrl);
    state.setResultRenderId(sourceRenderId);
    state.setView("hasil");
  }

  const isProcessing =
    state.loading ||
    state.renderStatus === "queued" ||
    state.renderStatus === "processing";
  const canRender =
    (Boolean(sourceRenderId) || !!state.file) &&
    state.balance > 0 &&
    !isProcessing;
  const hasUploadedImage = Boolean(state.previewUrl);
  const shownImage =
    state.view === "hasil" && state.resultUrl
      ? state.resultUrl
      : state.previewUrl;
  const canCompare = Boolean(state.previewUrl && state.resultUrl);
  const viewerTabs: ViewerTab[] = [
    { value: "asli", label: "Asli", disabled: !state.previewUrl },
    { value: "komparasi", label: "Komparasi", disabled: !canCompare },
    { value: "hasil", label: "Hasil", disabled: !state.resultUrl },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
      <RenderStudioControls
        projectId={projectId}
        projects={projects}
        mode={state.mode}
        setMode={state.setMode}
        style={state.style}
        setStyle={state.setStyle}
        outputFormat={state.outputFormat}
        setOutputFormat={state.setOutputFormat}
        location={state.location}
        setLocation={state.setLocation}
        surrounding={state.surrounding}
        setSurrounding={state.setSurrounding}
        lightsOn={state.lightsOn}
        setLightsOn={state.setLightsOn}
        time={state.time}
        setTime={state.setTime}
        weather={state.weather}
        setWeather={state.setWeather}
        onSwitchProject={switchProject}
        onCreateProject={() => {
          state.setCreateOpen(true);
          state.setNewProjectErrors({});
        }}
      />

      <div className="flex flex-col gap-4">
        <RenderPreviewViewer
          fileRef={fileRef}
          referenceRef={referenceRef}
          hasUploadedImage={hasUploadedImage}
          viewerTabs={viewerTabs}
          view={state.view}
          setView={state.setView}
          shownImage={shownImage}
          previewUrl={state.previewUrl}
          resultUrl={state.resultUrl}
          canCompare={canCompare}
          comparisonPosition={state.comparisonPosition}
          setComparisonPosition={state.setComparisonPosition}
          zoom={state.zoom}
          zoomOut={state.zoomOut}
          zoomIn={state.zoomIn}
          resetZoom={state.resetZoom}
          isProcessing={isProcessing}
          renderStatus={state.renderStatus}
          file={state.file}
          pickFile={state.pickFile}
          mode={state.mode}
          referencePreviewUrl={state.referencePreviewUrl}
          pickReference={state.pickReference}
          styleTransferStrength={state.styleTransferStrength}
          setStyleTransferStrength={state.setStyleTransferStrength}
          negativePrompt={state.negativePrompt}
          setNegativePrompt={state.setNegativePrompt}
          error={state.error}
        />

        {/* Manual prompt + actions, sticky at the bottom of the workspace. */}
        <div className="sticky bottom-4 z-20 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <RenderActionBar
            instruction={state.instruction}
            setInstruction={state.setInstruction}
            balance={state.balance}
            resultRenderId={state.resultRenderId}
            resultUrl={state.resultUrl}
            sharing={state.sharing}
            shareUrl={state.shareUrl}
            onShare={onShare}
            downloading={state.downloading}
            onDownload={onDownload}
            loading={state.loading}
            canRender={canRender}
            onRender={onRender}
          />
        </div>
      </div>

      {/* Info Render + Scene History (or project scenes for a new render). */}
      <aside className="flex flex-col gap-4">
        {renderInfo && <StudioRenderInfo info={renderInfo} />}
        {initialVersions.length > 0 ? (
          <StudioVersionHistory
            versions={initialVersions}
            activeId={selectedBaseAssetId}
            onSelect={loadVersion}
          />
        ) : (
          <RenderSceneList scenes={state.scenes} projectName={projectName} />
        )}
      </aside>

      {state.createOpen && (
        <CreateProjectModal
          name={state.newProjectName}
          setName={state.setNewProjectName}
          errors={state.newProjectErrors}
          setErrors={state.setNewProjectErrors}
          creating={state.creatingProject}
          onClose={() => state.setCreateOpen(false)}
          onSubmit={submitCreateProject}
        />
      )}
    </div>
  );
}
