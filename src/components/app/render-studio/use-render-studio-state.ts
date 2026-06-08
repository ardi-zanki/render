"use client";

import { useState } from "react";

import type { RenderMode, RenderOutputFormat } from "@/db/schema";
import type { Scene, StudioView } from "./types";

export function useRenderStudioState({
  defaultRenderMode,
  defaultOutputFormat,
  initialInstruction,
  initialBalance,
  initialScenes,
}: {
  defaultRenderMode: RenderMode;
  defaultOutputFormat: RenderOutputFormat;
  initialInstruction: string;
  initialBalance: number;
  initialScenes: Scene[];
}) {
  const [mode, setMode] = useState<RenderMode>(defaultRenderMode);
  const [style, setStyle] = useState("auto");
  const [location, setLocation] = useState("");
  const [surrounding, setSurrounding] = useState("auto");
  const [lightsOn, setLightsOn] = useState(false);
  const [time, setTime] = useState("auto");
  const [weather, setWeather] = useState("auto");
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
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultRenderId, setResultRenderId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<StudioView>("asli");
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
      setView("asli");
    } else {
      setFile(null);
      setPreviewUrl(null);
      setView("asli");
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
