"use client";

import { useState } from "react";

import type { RenderConfig, RenderMode, RenderOutputFormat } from "@/db/schema";
import type { Scene, StudioView } from "./types";

const clampZoom = (value: number) =>
  Math.min(3, Math.max(0.5, Number(value.toFixed(2))));

export function initialStudioView(initialResultUrl?: string | null): StudioView {
  return initialResultUrl ? "result" : "original";
}

export function initialStudioPreview(initialImageUrl?: string | null) {
  return initialImageUrl ?? null;
}

function revokeObjectUrl(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

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
  const initialTime = (() => {
    const saved = initialConfig?.time;
    if (defaultRenderMode !== "interior") return saved ?? "auto";
    if (["morning", "midday", "night", "mixed"].includes(saved ?? "")) {
      return saved as string;
    }
    if (saved === "evening" || saved === "auto") return "mixed";
    return "night";
  })();
  const [time, setTime] = useState(initialTime);
  const [weather, setWeather] = useState(initialConfig?.weather ?? "auto");
  const [instruction, setInstruction] = useState(initialInstruction);
  const [outputFormat, setOutputFormat] =
    useState<RenderOutputFormat>(defaultOutputFormat);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [styleTransferStrength, setStyleTransferStrength] = useState(0.65);

  const [file, setFile] = useState<File | null>(null);
  // Existing renders can use their original asset URL directly. Fetching it
  // into a File is unnecessary for edits (the server already owns the asset)
  // and made the entire view toolbar depend on cross-origin R2 fetch headers.
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialStudioPreview(initialImageUrl),
  );
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
  const [view, setView] = useState<StudioView>(
    initialStudioView(initialResultUrl),
  );
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
    revokeObjectUrl(previewUrl);
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
    revokeObjectUrl(referencePreviewUrl);
    setError("");
    if (f) {
      setReferenceFile(f);
      setReferencePreviewUrl(URL.createObjectURL(f));
    } else {
      setReferenceFile(null);
      setReferencePreviewUrl(null);
    }
  }

  function setZoomValue(next: number | ((value: number) => number)) {
    setZoom((value) =>
      clampZoom(typeof next === "function" ? next(value) : next),
    );
  }

  function zoomOut() {
    setZoomValue((value) => value - 0.25);
  }

  function zoomIn() {
    setZoomValue((value) => value + 0.25);
  }

  function resetZoom() {
    setZoomValue(1);
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
    setZoom: setZoomValue,
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
