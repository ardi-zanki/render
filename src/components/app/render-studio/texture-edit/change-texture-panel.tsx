"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, PanelLeft, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Textarea } from "@/components/ui/textarea";
import {
  TEXTURE_CATEGORIES,
  TEXTURE_LIBRARY,
  type TextureCategory,
} from "@/lib/renders/texture-library";
import { cn } from "@/lib/utils";
import type { TextureEditState } from "./use-texture-edit-state";

export function ChangeTexturePanel({
  state,
  onApply,
  onCollapse,
}: {
  state: TextureEditState;
  onApply: () => void;
  onCollapse?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<TextureCategory | null>(null);
  const textures = category
    ? TEXTURE_LIBRARY.filter((t) => t.category === category)
    : TEXTURE_LIBRARY;

  return (
    <Card className="flex h-fit flex-col lg:h-full lg:min-h-full">
      <CardContent className="flex flex-col gap-4 py-4 lg:min-h-0 lg:flex-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Ganti Tekstur
            </h2>
            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Ciutkan panel"
                title="Ciutkan panel"
                className="hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex [&_svg]:size-4"
              >
                <PanelLeft />
              </button>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Pilih area pada gambar, lalu pilih tekstur penggantinya.
          </p>
        </div>

        <Segmented
          size="sm"
          options={[
            { value: "library", label: "Library" },
            { value: "upload", label: "Upload" },
          ]}
          value={state.textureSource}
          onChange={(value) => state.setTextureSource(value)}
        />

        {/* Scrollable selection area — the footer below stays pinned. */}
        <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {state.textureSource === "library" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {TEXTURE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setCategory((prev) => (prev === c ? null : c))
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      category === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-muted",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {textures.map((t) => {
                  const active = state.selectedTextureId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => state.setSelectedTextureId(t.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-md border p-1.5 text-left transition-colors",
                        active
                          ? "border-primary ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <span
                        className="h-12 w-full rounded-sm border border-border/60"
                        style={{ background: t.thumbnail ? undefined : t.swatch }}
                      />
                      <span className="truncate text-xs font-medium text-foreground">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) =>
                  state.pickTextureFile(e.target.files?.[0] ?? null)
                }
              />
              {state.texturePreviewUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={state.texturePreviewUrl}
                    alt="Tekstur referensi"
                    className="h-32 w-full rounded-md border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => state.pickTextureFile(null)}
                    aria-label="Hapus tekstur"
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md bg-background/85 text-foreground shadow-floating hover:bg-background [&_svg]:size-3.5"
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-sm text-muted-foreground hover:border-primary/40"
                >
                  <ImagePlus className="size-5" />
                  Unggah gambar tekstur
                </button>
              )}
            </>
          )}
        </div>

        {/* Pinned footer: instruction + Apply stay visible while scrolling. */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-border/80 pt-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="texture-instruction" className="text-xs">
              Instruksi tambahan{" "}
              <span className="font-normal text-muted-foreground">
                (opsional)
              </span>
            </Label>
            <Textarea
              id="texture-instruction"
              value={state.instruction}
              onChange={(e) => state.setInstruction(e.target.value)}
              placeholder="mis. marmer putih dengan urat abu-abu halus"
              className="min-h-16 resize-none text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={onApply}
            disabled={!state.canApply}
            className="w-full gap-1 text-xs [&_svg]:size-3.5"
          >
            {state.applying ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Apply Texture
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
