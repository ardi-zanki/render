"use client";

import {
  Building2,
  Check,
  Download,
  ImagePlus,
  Loader2,
  Maximize2,
  Palette,
  Plus,
  Share2,
  Sofa,
  Sparkles,
  X,
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RenderMode } from "@/db/schema";
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
const cap = (s: string) => (s === "auto" ? "Otomatis" : s[0].toUpperCase() + s.slice(1));

type Scene = Pick<RenderListItem, "id" | "mode" | "status" | "resultUrl">;

function Segmented({
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
  defaultOutputFormat?: "jpg" | "png";
  initialInstruction?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const referenceRef = useRef<HTMLInputElement>(null);

  function switchProject(id: string) {
    if (id !== projectId) router.push(`/renders/new?project=${id}`);
  }

  async function createProjectInline() {
    const name = window.prompt("Nama project baru?");
    if (!name?.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    if (res.ok && json.id) {
      toast.success("Project dibuat");
      router.push(`/renders/new?project=${json.id}`);
    } else {
      toast.error(json.error ?? "Gagal membuat project");
    }
  }

  const [mode, setMode] = useState<RenderMode>(defaultRenderMode);
  const [style, setStyle] = useState("auto");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("auto");
  const [weather, setWeather] = useState("auto");
  const [instruction, setInstruction] = useState(initialInstruction);
  const [outputFormat, setOutputFormat] = useState<"jpg" | "png">(
    defaultOutputFormat,
  );

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
  const [view, setView] = useState<"hasil" | "asli">("hasil");

  const [balance, setBalance] = useState(initialBalance);
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [loading, setLoading] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    } else {
      setFile(null);
      setPreviewUrl(null);
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

  async function pollRender(id: string) {
    for (let attempt = 0; attempt < 90; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await fetch(`/api/renders/${id}`, { cache: "no-store" });
      if (!res.ok) continue;
      const json = await res.json();
      setRenderStatus(json.status);
      setScenes((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: json.status, resultUrl: json.resultUrl }
            : item,
        ),
      );

      if (json.status === "success") {
        setResultUrl(json.resultUrl);
        setView("hasil");
        toast.success("Render selesai!");
        router.refresh();
        return;
      }

      if (json.status === "failed") {
        setError(json.errorMessage ?? "Render gagal. Kredit sudah dikembalikan.");
        router.refresh();
        return;
      }
    }

    setError("Render masih diproses. Cek Riwayat Render beberapa saat lagi.");
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
      fd.append("weather", weather);
      if (location) fd.append("location", location);
      if (instruction) fd.append("instruction", instruction);
      if (referenceFile) fd.append("reference", referenceFile);

      const res = await fetch("/api/renders", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Render gagal. Coba lagi.");
        return;
      }
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
      void pollRender(json.renderId);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function onShare() {
    if (!resultRenderId) return;
    setSharing(true);
    try {
      const res = await fetch("/api/renders/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderId: resultRenderId }),
      });
      const json = await res.json();
      if (res.ok && json.url) {
        setShareUrl(json.url);
        try {
          await navigator.clipboard.writeText(json.url);
        } catch {
          // clipboard may be unavailable; the link is shown below regardless.
        }
      }
    } finally {
      setSharing(false);
    }
  }

  async function onDownload() {
    if (!resultRenderId) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/renders/${resultRenderId}/download-token`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        toast.error(json.error ?? "Download belum tersedia");
      }
    } finally {
      setDownloading(false);
    }
  }

  const isProcessing =
    loading || renderStatus === "queued" || renderStatus === "processing";
  const canRender = !!file && balance > 0 && !isProcessing;
  const shownImage = resultUrl && view === "hasil" ? resultUrl : previewUrl;

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
                onClick={createProjectInline}
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
                  onClick={() => setMode(m.value)}
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
            <Label htmlFor="style">Style Arsitektur</Label>
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
              onChange={(e) => setOutputFormat(e.target.value as "jpg" | "png")}
            >
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
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

          <div className="flex flex-col gap-2">
            <Label>Waktu</Label>
            <Segmented options={TIMES} value={time} onChange={setTime} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cuaca</Label>
            <Segmented options={WEATHERS} value={weather} onChange={setWeather} />
          </div>
        </CardContent>
      </Card>

      {/* Canvas + action */}
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col gap-4 py-5">
            {/* tabs */}
            {resultUrl && (
              <div className="flex gap-2">
                {(["hasil", "asli"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setView(t)}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                      view === t
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t === "hasil" ? "Hasil" : "Asli"}
                  </button>
                ))}
              </div>
            )}

            {/* canvas */}
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40">
              {shownImage ? (
                <RenderImage
                  src={view === "asli" ? previewUrl ?? "" : shownImage}
                  alt="Render"
                  className="size-full"
                />
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
            <h2 className="text-sm font-bold text-foreground">
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
    </div>
  );
}
