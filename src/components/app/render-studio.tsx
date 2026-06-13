"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useRenderStatusPolling,
  type PolledRender,
} from "@/hooks/use-render-status-polling";
import {
  apiErrorMessage,
  apiFieldErrors,
  apiJson,
  postJson,
} from "@/lib/client-api";
import { RenderActionBar } from "./render-studio/action-bar";
import { CreateProjectModal } from "./render-studio/create-project-modal";
import { RenderStudioControls } from "./render-studio/controls";
import { StudioTitleBar } from "./render-studio/title-bar";
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

// True only after client hydration — lets us portal into a DOM node that the
// server didn't render into, without a hydration mismatch.
const subscribeNoop = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

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
  initialRenderName = "Tanpa Judul",
}: RenderStudioProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const [renderName, setRenderName] = useState(initialRenderName);
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

  // Shared status-polling wiring for both fresh renders and in-place edits.
  // Only the toast/error copy differs; `onScene` lets the create flow also
  // mirror the live status onto its scene list.
  function pollRenderStatus(
    renderId: string,
    copy: { success: string; failure: string; timeout: string },
    onScene?: (render: PolledRender) => void,
  ) {
    startPolling(renderId, {
      onUpdate: (render) => {
        state.setRenderStatus(render.status);
        onScene?.(render);
      },
      onSuccess: (render) => {
        state.setResultUrl(render.resultUrl);
        state.setView("result");
        toast.success(copy.success);
        router.refresh();
      },
      onFailure: (render) => {
        state.setError(render.errorMessage ?? copy.failure);
        router.refresh();
      },
      onTimeout: () => state.setError(copy.timeout),
    });
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

  async function saveRenderName(next: string) {
    setRenderName(next);
    if (!sourceRenderId) return; // new render: applied on creation
    try {
      await postJson(`/api/renders/${sourceRenderId}/rename`, { name: next });
      toast.success("Nama render diperbarui");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal mengganti nama"));
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
      pollRenderStatus(json.renderId, {
        success: "Edit selesai!",
        failure: "Edit gagal. Kredit sudah dikembalikan.",
        timeout: "Edit masih diproses. Cek beberapa saat lagi.",
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
      state.setError("Unggah gambar desain terlebih dahulu.");
      return;
    }
    if (state.mode === "style_transfer" && !state.referenceFile) {
      state.setError("Unggah gambar referensi untuk Style Transfer.");
      return;
    }
    state.setLoading(true);
    state.setError("");
    try {
      const fd = new FormData();
      fd.append("image", state.file);
      fd.append("mode", state.mode);
      fd.append("name", renderName);
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
      pollRenderStatus(
        json.renderId,
        {
          success: "Render selesai!",
          failure: "Render gagal. Kredit sudah dikembalikan.",
          timeout: "Render masih diproses. Cek Riwayat Render beberapa saat lagi.",
        },
        (render) => {
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
      );
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
    state.setView("result");
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
    state.view === "result" && state.resultUrl
      ? state.resultUrl
      : state.previewUrl;
  const canCompare = Boolean(state.previewUrl && state.resultUrl);
  const viewerTabs: ViewerTab[] = [
    { value: "original", label: "Asli", disabled: !state.previewUrl },
    { value: "comparison", label: "Komparasi", disabled: !canCompare },
    { value: "result", label: "Hasil", disabled: !state.resultUrl },
  ];

  // Portal the title into the global header slot (rendered by the app shell).
  // Only after hydration, so the server/client trees match (the slot is empty
  // on the server and filled on the client).
  const headerSlot = hydrated
    ? document.getElementById("app-header-slot")
    : null;

  return (
    // Fixed-height studio: the three columns stay put and each scrolls on its
    // own (Config / Studio / Info) instead of the whole page scrolling.
    <div className="lg:h-[calc(100vh-5.5rem)]">
      {/* Title lives in the global header's top-left slot. */}
      {headerSlot &&
        createPortal(
          <StudioTitleBar name={renderName} onSave={saveRenderName} />,
          headerSlot,
        )}

      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
      {/* Column 1 — Configuration */}
      <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
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
      </div>

      {/* Column 2 — Studio canvas (title is in the header). */}
      <div className="flex flex-col lg:min-h-0">
          <RenderPreviewViewer
            fileRef={fileRef}
            referenceRef={referenceRef}
            allowRemoveImage={!sourceRenderId}
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
      </div>

      {/* Column 3 — Info, scrollable Scene History, then the manual prompt. */}
      <aside className="flex flex-col gap-4 lg:min-h-0">
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

        {/* Manual prompt + actions, pinned below the Scene History. */}
        <div className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-soft">
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
      </aside>
      </div>

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
