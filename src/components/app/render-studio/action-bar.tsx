"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RenderActionBar({
  instruction,
  setInstruction,
  balance,
  loading,
  canRender,
  onRender,
}: {
  instruction: string;
  setInstruction: (instruction: string) => void;
  balance: number;
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
      <div className="flex">
        {balance <= 0 ? (
          <Button asChild className="w-full">
            <Link href="/payments">Top up</Link>
          </Button>
        ) : (
          <Button
            onClick={onRender}
            disabled={!canRender}
            className="w-full"
          >
            {loading && <Loader2 className="animate-spin" />}
            Render
          </Button>
        )}
      </div>
    </div>
  );
}
