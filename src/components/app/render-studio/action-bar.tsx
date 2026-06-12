"use client";

import { Check, Download, Loader2, Share2, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Tambahkan instruksi (opsional)…"
        className="min-h-14 resize-none border-border/70 text-sm"
      />
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {/* Secondary actions are icon-only to stay compact in the column. */}
        {resultUrl && resultRenderId && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onShare}
            disabled={sharing}
            aria-label={shareUrl ? "Link tersalin" : "Bagikan"}
            title={shareUrl ? "Link tersalin" : "Bagikan"}
            className="size-7"
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
            className="size-7"
          >
            {downloading ? <Loader2 className="animate-spin" /> : <Download />}
          </Button>
        )}
        {balance <= 0 ? (
          <Button size="sm" asChild className="h-7 px-2.5">
            <Link href="/payments">Top up kredit</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onRender}
            disabled={!canRender}
            className="h-7 px-2.5"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
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
