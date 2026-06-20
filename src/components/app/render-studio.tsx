"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { useRenderStatusPolling } from "@/hooks/use-render-status-polling";
import { markRenderQueueSeen } from "@/hooks/use-render-queue";
import { cn } from "@/lib/utils";
import { RenderActionBar } from "./render-studio/action-bar";
import { CreateProjectModal } from "./render-studio/create-project-modal";
import { RenderStudioControls } from "./render-studio/controls";
import { StudioTitleBar } from "./render-studio/title-bar";
import { RenderPreviewViewer } from "./render-studio/preview-viewer";
import { StudioRenderInfo } from "./render-studio/render-info";
import { RenderSceneList } from "./render-studio/scene-list";
import { StudioVersionHistory } from "./render-studio/version-history";
import { ChangeTexturePanel } from "./render-studio/texture-edit/change-texture-panel";
import { MaskCanvas } from "./render-studio/texture-edit/mask-canvas";
import { SelectionToolbar } from "./render-studio/texture-edit/selection-toolbar";
import type {
  MaskCanvasHandle,
  TextureTool,
} from "./render-studio/texture-edit/types";
import { useTextureEditState } from "./render-studio/texture-edit/use-texture-edit-state";
import { type RenderStudioProps, type ViewerTab } from "./render-studio/types";
import { useRenderStudioActions } from "./render-studio/use-render-studio-actions";
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
  // A successful first render becomes the active editable resource without a
  // detour through Render History. Existing Studio links provide the same id
  // through sourceRenderId; fresh renders become active once a result exists.
  const activeRenderId =
    sourceRenderId ?? (state.resultUrl ? state.resultRenderId : null);

  // A completed result already visible in Studio has effectively been read,
  // regardless of whether Studio was opened from the queue or another page.
  useEffect(() => {
    if (activeRenderId && state.resultUrl) {
      void markRenderQueueSeen(activeRenderId);
    }
  }, [activeRenderId, state.resultUrl]);

  // Region/texture editor. Available only when editing a completed render that
  // already has a result to paint a mask over.
  const texture = useTextureEditState();
  const maskRef = useRef<MaskCanvasHandle>(null);
  const [studioMode, setStudioMode] = useState<"render" | "texture">("render");
  const editAvailable = Boolean(activeRenderId) && Boolean(state.resultUrl);
  const inTextureMode = studioMode === "texture" && editAvailable;
  // Both side panels collapse together (toggle lives in Column 1) for a wider
  // canvas; desktop only.
  const [panelsCollapsed, setPanelsCollapsed] = useState(false);
  // Stable handlers so the ref is read only when invoked (not during render).
  const handleMaskUndo = useCallback(() => maskRef.current?.undo(), []);
  const handleMaskRedo = useCallback(() => maskRef.current?.redo(), []);
  const handleMaskClear = useCallback(() => maskRef.current?.clear(), []);
  function handleTextureToolChange(tool: TextureTool) {
    texture.setTool(tool);
    if (tool === "pan" && state.zoom <= 1) {
      toast.info("Perbesar gambar di atas 100% untuk menggeser kanvas.");
    }
  }
  const actions = useRenderStudioActions({
    projectId,
    sourceRenderId: activeRenderId,
    renderName,
    setRenderName,
    selectedBaseAssetId,
    setSelectedBaseAssetId,
    state,
    texture,
    maskRef,
    router,
    startPolling,
    setStudioMode,
  });

  const isProcessing =
    state.loading ||
    state.renderStatus === "queued" ||
    state.renderStatus === "processing";
  const canRender =
    (Boolean(activeRenderId) || !!state.file) &&
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

  // Texture-edit canvas + toolbar live here (this component owns the mask ref),
  // and are slotted into the viewer column.
  const textureCanvas =
    inTextureMode && state.resultUrl ? (
      <MaskCanvas
        ref={maskRef}
        imageUrl={state.resultUrl}
        tool={texture.tool}
        brushSize={texture.brushSize}
        tolerance={texture.tolerance}
        zoom={state.zoom}
        onChange={texture.setMask}
        onError={(message) => toast.error(message)}
      />
    ) : null;
  const textureToolbar = inTextureMode ? (
    <SelectionToolbar
      tool={texture.tool}
      setTool={handleTextureToolChange}
      brushSize={texture.brushSize}
      setBrushSize={texture.setBrushSize}
      tolerance={texture.tolerance}
      setTolerance={texture.setTolerance}
      canUndo={texture.mask.canUndo}
      canRedo={texture.mask.canRedo}
      onUndo={handleMaskUndo}
      onRedo={handleMaskRedo}
      onClear={handleMaskClear}
    />
  ) : null;
  const renderActionBar = !inTextureMode ? (
    <RenderActionBar
      instruction={state.instruction}
      setInstruction={state.setInstruction}
      balance={state.balance}
      loading={state.loading}
      canRender={canRender}
      onRender={actions.onRender}
      showInstruction={state.mode !== "interior"}
    />
  ) : null;

  return (
    // Fixed-height studio: the three columns stay put and each scrolls on its
    // own (Config / Studio / Info) instead of the whole page scrolling.
    <div className="relative pb-4 lg:h-[calc(100vh-5.5rem)] lg:pb-0">
      {/* Title lives in the global header's top-left slot. */}
      {headerSlot &&
        createPortal(
          <StudioTitleBar name={renderName} onSave={actions.saveRenderName} />,
          headerSlot,
        )}

      <div
        className={cn(
          "grid h-full grid-cols-1 gap-4",
          panelsCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] xl:grid-cols-[320px_minmax(0,1fr)_300px]",
        )}
      >
        {/* Column 1 — Configuration, or Change Texture panel in Edit mode. */}
        <div
          className={cn(
            "order-2 flex flex-col gap-4 lg:order-none lg:min-h-0",
            // Texture panel manages its own internal scroll so Apply stays
            // pinned; the config form scrolls the whole column.
            inTextureMode ? "lg:overflow-hidden" : "lg:overflow-hidden",
            panelsCollapsed && "lg:hidden",
          )}
        >
          {inTextureMode ? (
            <ChangeTexturePanel
              state={texture}
              onApply={actions.onApplyTexture}
              onCollapse={() => setPanelsCollapsed(true)}
            />
          ) : (
            <RenderStudioControls
              onCollapse={() => setPanelsCollapsed(true)}
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
              onSwitchProject={actions.switchProject}
              onCreateProject={() => {
                state.setCreateOpen(true);
                state.setNewProjectErrors({});
              }}
              footer={renderActionBar}
            />
          )}
        </div>

        {/* Column 2 — Studio canvas (title is in the header). */}
        <div className="order-1 flex flex-col lg:order-none lg:min-h-0">
          <RenderPreviewViewer
            fileRef={fileRef}
            referenceRef={referenceRef}
            allowRemoveImage={!activeRenderId}
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
            setZoom={state.setZoom}
            zoomOut={state.zoomOut}
            zoomIn={state.zoomIn}
            resetZoom={state.resetZoom}
            isProcessing={isProcessing}
            renderStatus={state.renderStatus}
            pickFile={state.pickFile}
            mode={state.mode}
            referencePreviewUrl={state.referencePreviewUrl}
            pickReference={state.pickReference}
            styleTransferStrength={state.styleTransferStrength}
            setStyleTransferStrength={state.setStyleTransferStrength}
            negativePrompt={state.negativePrompt}
            setNegativePrompt={state.setNegativePrompt}
            editAvailable={editAvailable}
            studioMode={studioMode}
            setStudioMode={setStudioMode}
            panelsCollapsed={panelsCollapsed}
            onExpandPanels={() => setPanelsCollapsed(false)}
            textureCanvas={textureCanvas}
            textureToolbar={textureToolbar}
            texturePanActive={inTextureMode && texture.tool === "pan"}
          />
        </div>

        {/* Column 3 — Info and scrollable Scene History. Collapses together
          with Column 1 via the Column 1 toggle. */}
        <aside
          className={cn(
            "order-3 flex flex-col gap-4 lg:order-none lg:min-h-0",
            panelsCollapsed && "lg:hidden",
          )}
        >
          {renderInfo && <StudioRenderInfo info={renderInfo} />}
          {state.error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
            >
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
              <span>{state.error}</span>
            </p>
          )}
          {initialVersions.length > 0 ? (
            <StudioVersionHistory
              versions={initialVersions}
              activeId={selectedBaseAssetId}
              onSelect={actions.loadVersion}
            />
          ) : (
            <RenderSceneList scenes={state.scenes} projectName={projectName} />
          )}

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
          onSubmit={actions.submitCreateProject}
        />
      )}
    </div>
  );
}
