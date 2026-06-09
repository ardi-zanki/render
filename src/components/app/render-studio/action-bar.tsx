"use client";

import {
  Check,
  Download,
  Loader2,
  Share2,
  Sparkles,
} from "lucide-react";
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
            <Button variant="outline" onClick={onShare} disabled={sharing}>
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
            <Button variant="inverse" onClick={onDownload} disabled={downloading}>
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
        <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs">
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
