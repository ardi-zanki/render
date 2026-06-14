"use client";

import { Check, Download, Loader2, Share2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RenderActionBar({
  instruction,
  setInstruction,
  balance,
  resultRenderId,
  resultUrl,
  sharing,
  shareUrl,
  onShare,
  downloading,
  onDownload,
  loading,
  canRender,
  onRender,
}: {
  instruction: string;
  setInstruction: (instruction: string) => void;
  balance: number;
  resultRenderId: string | null;
  resultUrl: string | null;
  sharing: boolean;
  shareUrl: string | null;
  onShare: () => void;
  downloading: boolean;
  onDownload: () => void;
  loading: boolean;
  canRender: boolean;
  onRender: () => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="studio-instruction" className="text-xs">
          Instruksi tambahan{" "}
          <span className="font-normal text-muted-foreground">(opsional)</span>
        </Label>
        <Textarea
          id="studio-instruction"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Melengkapi konfigurasi — mis. ganti warna sofa…"
          className="min-h-14 resize-none border-border/70 text-sm"
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {/* Sized to match the canvas tab/zoom controls (compact, text-xs). */}
        {resultUrl && resultRenderId && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onShare}
            disabled={sharing}
            aria-label={shareUrl ? "Tautan tersalin" : "Bagikan"}
            title={shareUrl ? "Tautan tersalin" : "Bagikan"}
            className="size-6 [&_svg]:size-3.5"
          >
            {sharing ? (
              <Loader2 className="animate-spin" />
            ) : shareUrl ? (
              <Check />
            ) : (
              <Share2 />
            )}
          </Button>
        )}
        {resultUrl && (
          <Button
            variant="inverse"
            size="icon-sm"
            onClick={onDownload}
            disabled={downloading}
            aria-label="Unduh"
            title="Unduh"
            className="size-6 [&_svg]:size-3.5"
          >
            {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          </Button>
        )}
        {balance <= 0 ? (
          <Button size="sm" asChild className="h-6 gap-1 px-2.5 text-xs">
            <Link href="/payments">Top up</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onRender}
            disabled={!canRender}
            className="h-6 gap-1 px-2.5 text-xs [&_svg]:size-3.5"
          >
            {loading && <Loader2 className="animate-spin" />}
            Render
          </Button>
        )}
      </div>

      {shareUrl && (
        <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-1.5 text-xs">
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
  );
}
