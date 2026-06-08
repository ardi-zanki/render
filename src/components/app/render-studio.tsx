"use client";

import {
  Building2,
  Check,
  Download,
  ImagePlus,
  Lightbulb,
  Loader2,
  Maximize2,
  Palette,
  Plus,
  Share2,
  Sofa,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { RenderImage } from "@/components/app/render-image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode, RenderOutputFormat } from "@/db/schema";
import { useRenderStatusPolling } from "@/hooks/use-render-status-polling";
import {
  apiErrorMessage,
  apiFieldErrors,
  apiJson,
  postJson,
} from "@/lib/client-api";
import type { RenderListItem } from "@/lib/renders/service";
import { cn } from "@/lib/utils";

const MODES: { value: RenderMode; label: string; icon: typeof Sofa }[] = [
  { value: "interior", label: "Interior", icon: Sofa },
  { value: "exterior", label: "Exterior", icon: Building2 },
  { value: "style_transfer", label: "Style", icon: Palette },
  { value: "upscale", label: "Upscale", icon: Maximize2 },
];

const STYLES = [
  ["auto", "Deteksi Otomatis"],
  ["modern", "Modern"],
  ["minimalis", "Minimalis"],
  ["industrial", "Industrial"],
  ["skandinavia", "Skandinavia"],
  ["klasik", "Klasik"],
  ["tropis", "Tropis"],
  ["kontemporer", "Kontemporer"],
];
const TIMES = ["auto", "pagi", "siang", "sore", "malam"];
const WEATHERS = ["auto", "cerah", "berawan", "mendung", "hujan", "berkabut"];
const SURROUNDINGS = {
  exterior: [
    { value: "auto", label: "Otomatis" },
    {
      value: "urban street context with neighboring buildings",
      label: "Kawasan Urban",
    },
    {
      value: "quiet residential neighborhood context",
      label: "Perumahan",
    },
    {
      value: "tropical garden and lush greenery around the building",
      label: "Taman Tropis",
    },
    {
      value: "commercial streetscape context",
      label: "Area Komersial",
    },
  ],
  interior: [
    { value: "auto", label: "Otomatis" },
    {
      value: "large window view with natural daylight",
      label: "Jendela Besar",
    },
    {
      value: "city view through the window",
      label: "View Kota",
    },
    {
      value: "garden view through the window",
      label: "View Taman",
    },
    {
      value: "no visible window, controlled interior lighting",
      label: "Tanpa Jendela",
    },
  ],
};
const OUTPUT_FORMATS: { value: RenderOutputFormat; label: string }[] = [
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];
const cap = (s: string) => (s === "auto" ? "Otomatis" : s[0].toUpperCase() + s.slice(1));

type Scene = Pick<RenderListItem, "id" | "mode" | "status" | "resultUrl">;
type StudioView = "asli" | "komparasi" | "hasil";
type CreateProjectResponse = { id: string; name: string };
type CreateRenderResponse = {
  renderId: string;
  status?: string;
  balance?: number;
};
type ShareResponse = { url: string };
type DownloadTokenResponse = { url: string };

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === o
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted",
          )}
        >
          {cap(o)}
        </button>
      ))}
    </div>
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
}: {
  projectId: string;
  projectName: string;
  projects: { id: string; name: string }[];
  initialBalance: number;
  initialScenes: Scene[];
  defaultRenderMode?: RenderMode;
  defaultOutputFormat?: RenderOutputFormat;
  initialInstruction?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);
  const { startPolling } = useRenderStatusPolling();

  function switchProject(id: string) {
    if (id !== projectId) router.push(`/renders/new?project=${id}`);
  }

  async function submitCreateProject() {
    const name = newProjectName.trim();
    if (!name) {
      setNewProjectErrors({ name: "Nama project wajib diisi" });
      return;
    }
    setCreatingProject(true);
    setNewProjectErrors({});
    try {
      const json = await postJson<CreateProjectResponse>("/api/projects", {
        name,
      });
      toast.success("Project dibuat");
      setCreateOpen(false);
      setNewProjectName("");
      setNewProjectErrors({});
      router.push(`/renders/new?project=${json.id}`);
    } catch (err) {
      const fieldErrors = apiFieldErrors(err);
      if (fieldErrors) setNewProjectErrors(fieldErrors);
      toast.error(apiErrorMessage(err, "Gagal membuat project"));
    } finally {
      setCreatingProject(false);
    }
  }

  const [mode, setMode] = useState<RenderMode>(defaultRenderMode);
  const [style, setStyle] = useState("auto");
  const [location, setLocation] = useState("");
  const [surrounding, setSurrounding] = useState("auto");
  const [lightsOn, setLightsOn] = useState(false);
  const [time, setTime] = useState("auto");
  const [weather, setWeather] = useState("auto");
  const [instruction, setInstruction] = useState(initialInstruction);
  const [outputFormat, setOutputFormat] = useState<RenderOutputFormat>(
    defaultOutputFormat,
  );
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

  async function onRender() {
    if (!file) {
      setError("Upload gambar desain dulu ya.");
      return;
    }
    if (mode === "style_transfer" && !referenceFile) {
      setError("Upload reference image untuk Style Transfer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("mode", mode);
      fd.append("projectId", projectId);
      fd.append("outputFormat", outputFormat);
      if (style !== "auto") fd.append("style", style);
      fd.append("time", time);
      if (mode !== "interior") fd.append("weather", weather);
      if (location) fd.append("location", location);
      if (surrounding !== "auto") fd.append("surrounding", surrounding);
      if (lightsOn) fd.append("lightsOn", "true");
      if (instruction) fd.append("instruction", instruction);
      if (referenceFile) {
        fd.append("reference", referenceFile);
        fd.append("styleTransferStrength", String(styleTransferStrength));
        if (negativePrompt.trim()) {
          fd.append("negativePrompt", negativePrompt.trim());
        }
      }

      const json = await apiJson<CreateRenderResponse>("/api/renders", {
        method: "POST",
        body: fd,
      });
      setResultUrl(null);
      setResultRenderId(json.renderId);
      setShareUrl(null);
      setRenderStatus(json.status ?? "queued");
      setBalance((b) => json.balance ?? b - 1);
      setScenes((s) => [
        { id: json.renderId, mode, status: "queued", resultUrl: null },
        ...s,
      ]);
      toast.success("Render masuk antrean");
      startPolling(json.renderId, {
        onUpdate: (render) => {
          setRenderStatus(render.status);
          setScenes((items) =>
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
          setResultUrl(render.resultUrl);
          setView("hasil");
          toast.success("Render selesai!");
          router.refresh();
        },
        onFailure: (render) => {
          setError(
            render.errorMessage ?? "Render gagal. Kredit sudah dikembalikan.",
          );
          router.refresh();
        },
        onTimeout: () => {
          setError("Render masih diproses. Cek Riwayat Render beberapa saat lagi.");
        },
      });
      router.refresh();
    } catch (err) {
      setError(apiErrorMessage(err, "Tidak bisa terhubung ke server. Coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  async function onShare() {
    if (!resultRenderId) return;
    setSharing(true);
    try {
      const json = await postJson<ShareResponse>("/api/renders/share", {
        renderId: resultRenderId,
      });
      setShareUrl(json.url);
      try {
        await navigator.clipboard.writeText(json.url);
      } catch {
        // clipboard may be unavailable; the link is shown below regardless.
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, "Gagal membuat link share"));
    } finally {
      setSharing(false);
    }
  }

  async function onDownload() {
    if (!resultRenderId) return;
    setDownloading(true);
    try {
      const json = await apiJson<DownloadTokenResponse>(
        `/api/renders/${resultRenderId}/download-token`,
        { method: "POST" },
      );
      window.location.href = json.url;
    } catch (err) {
      toast.error(apiErrorMessage(err, "Download belum tersedia"));
    } finally {
      setDownloading(false);
    }
  }

  const isProcessing =
    loading || renderStatus === "queued" || renderStatus === "processing";
  const canRender = !!file && balance > 0 && !isProcessing;
  const hasUploadedImage = Boolean(previewUrl);
  const shownImage = view === "hasil" && resultUrl ? resultUrl : previewUrl;
  const canCompare = Boolean(previewUrl && resultUrl);
  const styleLabel = mode === "interior" ? "Style Interior" : "Style Arsitektur";
  const surroundingOptions =
    mode === "interior" ? SURROUNDINGS.interior : SURROUNDINGS.exterior;
  const surroundingLabel =
    mode === "interior" ? "View Jendela" : "Lingkungan Sekitar";
  const viewerTabs: { value: StudioView; label: string; disabled: boolean }[] = [
    { value: "asli", label: "Asli", disabled: !previewUrl },
    { value: "komparasi", label: "Komparasi", disabled: !canCompare },
    { value: "hasil", label: "Hasil", disabled: !resultUrl },
  ];

  function zoomOut() {
    setZoom((value) => Math.max(0.5, Number((value - 0.25).toFixed(2))));
  }

  function zoomIn() {
    setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))));
  }

  function resetZoom() {
    setZoom(1);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      {/* Controls */}
      <Card className="h-fit">
        <CardContent className="flex flex-col gap-5 py-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project">Project</Label>
            <div className="flex gap-2">
              <Select
                id="project"
                value={projectId}
                onChange={(e) => switchProject(e.target.value)}
                className="flex-1"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setCreateOpen(true);
                  setNewProjectErrors({});
                }}
                title="Buat project baru"
                aria-label="Buat project baru"
              >
                <Plus />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Mode Render</Label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    setMode(m.value);
                    setSurrounding("auto");
                    if (m.value === "interior") setWeather("auto");
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                    mode === m.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <m.icon className="size-4" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="style">{styleLabel}</Label>
            <Select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              {STYLES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="outputFormat">Format Output</Label>
            <Select
              id="outputFormat"
              value={outputFormat}
              onChange={(e) =>
                setOutputFormat(e.target.value as RenderOutputFormat)
              }
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Lokasi Proyek</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bandung, Bali, Jakarta"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="surrounding">{surroundingLabel}</Label>
            <Select
              id="surrounding"
              value={surrounding}
              onChange={(e) => setSurrounding(e.target.value)}
            >
              {surroundingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Waktu</Label>
            <ChipGroup options={TIMES} value={time} onChange={setTime} />
          </div>

          {mode !== "interior" && (
            <div className="flex flex-col gap-2">
              <Label>Cuaca</Label>
              <ChipGroup
                options={WEATHERS}
                value={weather}
                onChange={setWeather}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <Label className="text-base font-semibold text-foreground">
              Objek
            </Label>
            <button
              type="button"
              aria-pressed={lightsOn}
              onClick={() => setLightsOn((value) => !value)}
              className={cn(
                "flex h-12 items-center justify-between gap-3 rounded-lg border px-4 text-sm font-semibold transition-colors",
                lightsOn
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/60 text-foreground hover:border-primary/40",
              )}
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="size-4" />
                Nyalain Lampu
              </span>
              <span
                className={cn(
                  "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                  lightsOn ? "bg-primary" : "bg-muted-foreground/25",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full bg-background shadow-sm transition-transform",
                    lightsOn && "translate-x-5",
                  )}
                />
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Canvas + action */}
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 py-5">
            {/* tabs + zoom */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {hasUploadedImage ? (
                <div
                  role="tablist"
                  className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1"
                >
                  {viewerTabs.map((tab) => {
                    const active = tab.value === view;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        disabled={tab.disabled}
                        onClick={() => setView(tab.value)}
                        className={cn(
                          "rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
                          active
                            ? "bg-card text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div />
              )}

              {shownImage && (
                <div className="inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg bg-muted p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    aria-label="Zoom out"
                    title="Zoom out"
                    className="size-7"
                  >
                    <ZoomOut />
                  </Button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    className="h-7 min-w-11 rounded-md px-1.5 text-xs font-semibold text-foreground hover:bg-card"
                    title="Reset zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    disabled={zoom >= 3}
                    aria-label="Zoom in"
                    title="Zoom in"
                    className="size-7"
                  >
                    <ZoomIn />
                  </Button>
                </div>
              )}
            </div>

            {/* canvas */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
              {canCompare && view === "komparasi" ? (
                <div className="relative size-full overflow-hidden bg-background">
                  <RenderImage
                    src={resultUrl ?? ""}
                    alt="Hasil render"
                    className="size-full"
                    style={{ transform: `scale(${zoom})` }}
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)`,
                    }}
                  >
                    <RenderImage
                      src={previewUrl ?? ""}
                      alt="Gambar asli"
                      className="size-full"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 w-px bg-background/90 shadow-[0_0_0_1px_rgb(15_23_42/0.12)]"
                    style={{ left: `${comparisonPosition}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={comparisonPosition}
                    onChange={(event) =>
                      setComparisonPosition(Number(event.target.value))
                    }
                    className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                    aria-label="Geser komparasi"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
                    style={{ left: `${comparisonPosition}%` }}
                  >
                    <span>Asli</span>
                    <span className="text-muted-foreground">|</span>
                    <span>Hasil</span>
                  </div>
                </div>
              ) : shownImage ? (
                <div className="size-full overflow-hidden">
                  <RenderImage
                    src={shownImage}
                    alt={view === "hasil" ? "Hasil render" : "Gambar asli"}
                    className="size-full transition-transform"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 text-muted-foreground"
                >
                  <div className="flex size-11 items-center justify-center rounded-md bg-secondary">
                    <ImagePlus className="size-5" />
                  </div>
                  <span className="text-sm font-medium">
                    Klik untuk upload gambar desain
                  </span>
                  <span className="text-xs">JPG, PNG, atau WebP · maks 10MB</span>
                </button>
              )}

              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                  <Loader2 className="size-7 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    {renderStatus === "queued"
                      ? "Render masuk antrean..."
                      : "Memproses render..."}
                  </p>
                </div>
              )}

              {file && !isProcessing && (
                <button
                  type="button"
                  onClick={() => pickFile(null)}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm hover:bg-background"
                  aria-label="Hapus gambar"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {mode === "style_transfer" && (
              <div className="rounded-lg border border-border bg-muted/35 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <Label>Reference Image</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Wajib untuk Style Transfer.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => referenceRef.current?.click()}
                    disabled={isProcessing}
                  >
                    <ImagePlus /> Pilih
                  </Button>
                </div>
                {referencePreviewUrl ? (
                  <div className="relative overflow-hidden rounded-md border border-border bg-muted">
                    <RenderImage
                      src={referencePreviewUrl}
                      alt="Reference"
                      className="aspect-video size-full"
                    />
                    {!isProcessing && (
                      <button
                        type="button"
                        onClick={() => pickReference(null)}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-background/85 text-foreground shadow-sm"
                        aria-label="Hapus reference"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => referenceRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground"
                  >
                    <ImagePlus className="size-4" />
                    Upload gambar referensi style
                  </button>
                )}
                <input
                  ref={referenceRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => pickReference(e.target.files?.[0] ?? null)}
                />
                <div className="mt-3 grid gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="styleTransferStrength">
                        Kekuatan style
                      </Label>
                      <span className="text-xs font-medium text-muted-foreground">
                        {Math.round(styleTransferStrength * 100)}%
                      </span>
                    </div>
                    <Input
                      id="styleTransferStrength"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={styleTransferStrength}
                      onChange={(e) =>
                        setStyleTransferStrength(Number(e.target.value))
                      }
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="negativePrompt">Negative prompt</Label>
                    <Textarea
                      id="negativePrompt"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="Elemen yang ingin dihindari: blur, furniture berlebihan, warna terlalu gelap..."
                      maxLength={1000}
                      className="min-h-16"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Instruksi tambahan (boleh kosong): material kayu hangat, banyak tanaman..."
                className="min-h-20"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4 text-primary" />
                  Biaya: <span className="font-semibold text-foreground">1 kredit</span>
                  <span className="text-muted-foreground">· sisa {balance}</span>
                </div>
                <div className="flex items-center gap-2">
                  {resultRenderId && (
                    <Button variant="outline" asChild>
                      <Link href={`/renders/${resultRenderId}`}>Detail</Link>
                    </Button>
                  )}
                  {resultUrl && resultRenderId && (
                    <Button
                      variant="outline"
                      onClick={onShare}
                      disabled={sharing}
                    >
                      {sharing ? (
                        <Loader2 className="animate-spin" />
                      ) : shareUrl ? (
                        <Check />
                      ) : (
                        <Share2 />
                      )}
                      {shareUrl ? "Tersalin" : "Bagikan"}
                    </Button>
                  )}
                  {resultUrl && (
                    <Button
                      variant="inverse"
                      onClick={onDownload}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Download />
                      )}
                      Unduh
                    </Button>
                  )}
                  {balance <= 0 ? (
                    <Button asChild>
                      <Link href="/payments">Top up kredit</Link>
                    </Button>
                  ) : (
                    <Button onClick={onRender} disabled={!canRender}>
                      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      Render
                    </Button>
                  )}
                </div>
              </div>

              {shareUrl && (
                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <Share2 className="size-3.5 shrink-0 text-primary" />
                  <span className="truncate font-mono text-muted-foreground">
                    {shareUrl}
                  </span>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto shrink-0 font-medium text-primary hover:underline"
                  >
                    Buka
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenes */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Scene · {projectName}
            </h2>
            <Badge variant="secondary">{scenes.length}</Badge>
          </div>
          {scenes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada render di project ini.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {scenes.map((s) => (
                <div
                  key={s.id}
                  className="aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                >
                  {s.resultUrl && (
                    <RenderImage
                      src={s.resultUrl}
                      alt={s.mode}
                      className="size-full"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {createOpen && (
        <Modal
          onClose={() => setCreateOpen(false)}
          labelledBy="rs-create-project-title"
          panelClassName="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-dialog"
        >
          <h2
            id="rs-create-project-title"
            className="text-base font-semibold text-foreground"
          >
            Buat project baru
          </h2>
          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="rs-new-project">Nama project</Label>
            <Input
              id="rs-new-project"
              value={newProjectName}
              onChange={(e) => {
                setNewProjectName(e.target.value);
                setNewProjectErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="Nama project"
              maxLength={80}
              aria-invalid={!!newProjectErrors.name}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submitCreateProject();
                }
              }}
            />
            {newProjectErrors.name && (
              <p className="text-xs text-destructive">
                {newProjectErrors.name}
              </p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creatingProject}
            >
              Batal
            </Button>
            <Button
              onClick={submitCreateProject}
              disabled={creatingProject}
            >
              {creatingProject && <Loader2 className="animate-spin" />}
              Buat
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
