"use client";

import { useEffect, useRef, useState } from "react";

import type { RenderConfig, RenderMode, RenderOutputFormat } from "@/db/schema";
import type { Scene, StudioView } from "./types";

export function useRenderStudioState({
  defaultRenderMode,
  defaultOutputFormat,
  initialInstruction,
  initialBalance,
  initialScenes,
  initialConfig,
  initialImageUrl,
  initialResultUrl,
  initialResultRenderId,
}: {
  defaultRenderMode: RenderMode;
  defaultOutputFormat: RenderOutputFormat;
  initialInstruction: string;
  initialBalance: number;
  initialScenes: Scene[];
  initialConfig?: RenderConfig | null;
  initialImageUrl?: string | null;
  initialResultUrl?: string | null;
  initialResultRenderId?: string | null;
}) {
  const [mode, setMode] = useState<RenderMode>(defaultRenderMode);
  const [style, setStyle] = useState(initialConfig?.style ?? "auto");
  const [location, setLocation] = useState(initialConfig?.location ?? "");
  const [surrounding, setSurrounding] = useState(
    initialConfig?.surrounding ?? "auto",
  );
  const [lightsOn, setLightsOn] = useState(initialConfig?.lightsOn ?? false);
  const [time, setTime] = useState(initialConfig?.time ?? "auto");
  const [weather, setWeather] = useState(initialConfig?.weather ?? "auto");
  const [instruction, setInstruction] = useState(initialInstruction);
  const [outputFormat, setOutputFormat] =
    useState<RenderOutputFormat>(defaultOutputFormat);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [styleTransferStrength, setStyleTransferStrength] = useState(0.65);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(
    null,
  );
  const [resultUrl, setResultUrl] = useState<string | null>(
    initialResultUrl ?? null,
  );
  const [resultRenderId, setResultRenderId] = useState<string | null>(
    initialResultRenderId ?? null,
  );
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<StudioView>("original");
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [zoom, setZoom] = useState(1);

  const [balance, setBalance] = useState(initialBalance);
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [loading, setLoading] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectErrors, setNewProjectErrors] = useState<
    Record<string, string>
  >({});
  const [creatingProject, setCreatingProject] = useState(false);

  function pickFile(f: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResultUrl(null);
    setResultRenderId(null);
    setShareUrl(null);
    setRenderStatus(null);
    setError("");
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setView("original");
    } else {
      setFile(null);
      setPreviewUrl(null);
      setView("original");
    }
  }

  function pickReference(f: File | null) {
    if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    setError("");
    if (f) {
      setReferenceFile(f);
      setReferencePreviewUrl(URL.createObjectURL(f));
    } else {
      setReferenceFile(null);
      setReferencePreviewUrl(null);
    }
  }

  // "Open Studio": pull the source render's original image onto the canvas once,
  // so the user can re-render without re-uploading. Failures (e.g. cross-origin
  // storage) fall back silently to the empty uploader.
  const loadedInitialImage = useRef(false);
  useEffect(() => {
    if (!initialImageUrl || loadedInitialImage.current) return;
    // Guard against StrictMode double-invoke; no per-run cancel flag so the
    // single fetch always applies (cancelling it would leave the canvas empty
    // when the cleanup runs before the fetch resolves).
    loadedInitialImage.current = true;
    void (async () => {
      try {
        const res = await fetch(initialImageUrl);
        if (!res.ok) return;
        const blob = await res.blob();
        const type = blob.type || "image/jpeg";
        const ext = type.includes("png")
          ? "png"
          : type.includes("webp")
            ? "webp"
            : "jpg";
        // Set the original directly (not via pickFile) so the pre-filled
        // previous result is kept — enabling the Komparasi/Hasil tabs.
        setFile(new File([blob], `source.${ext}`, { type }));
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
      } catch {
        // Original not reachable — leave the uploader empty.
      }
    })();
  }, [initialImageUrl]);

  function zoomOut() {
    setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))));
  }

  function zoomIn() {
    setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
  }

  function resetZoom() {
    setZoom(1);
  }

  return {
    mode,
    setMode,
    style,
    setStyle,
    location,
    setLocation,
    surrounding,
    setSurrounding,
    lightsOn,
    setLightsOn,
    time,
    setTime,
    weather,
    setWeather,
    instruction,
    setInstruction,
    outputFormat,
    setOutputFormat,
    negativePrompt,
    setNegativePrompt,
    styleTransferStrength,
    setStyleTransferStrength,
    file,
    previewUrl,
    referenceFile,
    referencePreviewUrl,
    resultUrl,
    setResultUrl,
    resultRenderId,
    setResultRenderId,
    shareUrl,
    setShareUrl,
    sharing,
    setSharing,
    downloading,
    setDownloading,
    view,
    setView,
    comparisonPosition,
    setComparisonPosition,
    zoom,
    balance,
    setBalance,
    scenes,
    setScenes,
    loading,
    setLoading,
    renderStatus,
    setRenderStatus,
    error,
    setError,
    createOpen,
    setCreateOpen,
    newProjectName,
    setNewProjectName,
    newProjectErrors,
    setNewProjectErrors,
    creatingProject,
    setCreatingProject,
    pickFile,
    pickReference,
    zoomOut,
    zoomIn,
    resetZoom,
  };
}
