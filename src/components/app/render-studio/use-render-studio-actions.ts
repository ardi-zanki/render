"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { toast } from "sonner";

import type { PollHandlers, PolledRender } from "@/hooks/use-render-status-polling";
import {
  apiErrorMessage,
  apiFieldErrors,
  apiJson,
  postJson,
} from "@/lib/client-api";
import type { MaskCanvasHandle } from "./texture-edit/types";
import type { useTextureEditState } from "./texture-edit/use-texture-edit-state";
import type {
  CreateProjectResponse,
  CreateRenderResponse,
  DownloadTokenResponse,
  ShareResponse,
  StudioVersion,
} from "./types";
import type { useRenderStudioState } from "./use-render-studio-state";

type StudioState = ReturnType<typeof useRenderStudioState>;
type TextureState = ReturnType<typeof useTextureEditState>;
type StudioMode = "render" | "texture";

type RouterLike = {
  push: (href: string) => void;
  refresh: () => void;
};

export function useRenderStudioActions({
  projectId,
  sourceRenderId,
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
}: {
  projectId: string;
  sourceRenderId: string | null;
  renderName: string;
  setRenderName: Dispatch<SetStateAction<string>>;
  selectedBaseAssetId: string | null;
  setSelectedBaseAssetId: Dispatch<SetStateAction<string | null>>;
  state: StudioState;
  texture: TextureState;
  maskRef: RefObject<MaskCanvasHandle | null>;
  router: RouterLike;
  startPolling: (renderId: string, handlers?: PollHandlers) => void;
  setStudioMode: Dispatch<SetStateAction<StudioMode>>;
}) {
  function switchProject(id: string) {
    if (id !== projectId) router.push(`/renders/new?project=${id}`);
  }

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
      onCancelled: () => {
        state.setError("");
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
    if (!sourceRenderId) return;
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
          timeout: "Render masih diproses. Cek Riwayat render beberapa saat lagi.",
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
      toast.error(apiErrorMessage(err, "Gagal membuat tautan"));
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
      toast.error(apiErrorMessage(err, "Unduh belum tersedia"));
    } finally {
      state.setDownloading(false);
    }
  }

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

  async function onApplyTexture() {
    if (!sourceRenderId) return;
    const blob = await maskRef.current?.toMaskBlob();
    if (!blob) {
      toast.error("Pilih dulu area yang ingin diganti.");
      return;
    }
    texture.setApplying(true);
    state.setError("");
    try {
      const fd = new FormData();
      fd.append("mask", blob, "mask.png");
      if (texture.textureSource === "library" && texture.selectedTextureId) {
        fd.append("libraryTextureId", texture.selectedTextureId);
      }
      if (texture.textureSource === "upload" && texture.textureFile) {
        fd.append("texture", texture.textureFile);
      }
      if (
        texture.textureSource === "description" &&
        texture.textureDescription.trim()
      ) {
        fd.append("textureDescription", texture.textureDescription.trim());
      }
      if (texture.textureSource !== "description" && texture.instruction.trim()) {
        fd.append("instruction", texture.instruction.trim());
      }
      if (selectedBaseAssetId) fd.append("baseAssetId", selectedBaseAssetId);

      const json = await apiJson<CreateRenderResponse>(
        `/api/renders/${sourceRenderId}/texture-edit`,
        { method: "POST", body: fd },
      );
      state.setRenderStatus(json.status ?? "queued");
      state.setResultRenderId(json.renderId);
      state.setBalance((balance) => json.balance ?? balance - 1);
      toast.success("Edit tekstur masuk antrean");
      setStudioMode("render");
      state.setView("result");
      pollRenderStatus(json.renderId, {
        success: "Edit tekstur selesai!",
        failure: "Edit tekstur gagal. Kredit sudah dikembalikan.",
        timeout: "Edit tekstur masih diproses. Cek beberapa saat lagi.",
      });
      router.refresh();
    } catch (err) {
      const message = apiErrorMessage(err, "Gagal menerapkan tekstur");
      state.setError(message);
      toast.error(message);
    } finally {
      texture.setApplying(false);
    }
  }

  return {
    switchProject,
    submitCreateProject,
    saveRenderName,
    onRender,
    onShare,
    onDownload,
    loadVersion,
    onApplyTexture,
  };
}
