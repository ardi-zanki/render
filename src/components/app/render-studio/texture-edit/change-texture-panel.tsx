"use client";

import { useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  PanelLeft,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
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

function TextureSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
      <div className="mb-3 flex items-center">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

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
    <div className="flex h-fit flex-col overflow-hidden rounded-lg border border-border/80 bg-card lg:h-full lg:min-h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border/70 bg-card/95 px-4 py-3 backdrop-blur">
        <h1 className="text-sm font-semibold text-foreground">Edit Texture</h1>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Ciutkan panel"
            title="Ciutkan panel"
            className="hidden size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex [&_svg]:size-4"
          >
            <PanelLeft />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 px-4 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <TextureSection title="Area & Sumber">
          <p className="text-xs leading-5 text-muted-foreground">
            Pilih area pada gambar, lalu tentukan tekstur penggantinya.
          </p>
          <Segmented
            size="sm"
            className="grid w-full grid-cols-3"
            options={[
              { value: "library", label: "Library" },
              { value: "upload", label: "Upload" },
              { value: "description", label: "Deskripsi" },
            ]}
            value={state.textureSource}
            onChange={(value) => state.setTextureSource(value)}
          />
        </TextureSection>

        <TextureSection
          title={
            state.textureSource === "library"
              ? "Library Material"
              : state.textureSource === "upload"
                ? "Upload Referensi"
                : "Deskripsi Material"
          }
        >
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
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
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
          ) : state.textureSource === "upload" ? (
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
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="texture-description">Deskripsi</Label>
              <Textarea
                id="texture-description"
                value={state.textureDescription}
                onChange={(e) => state.setTextureDescription(e.target.value)}
                placeholder="mis. marmer putih dengan urat abu-abu halus"
                className="min-h-32 resize-none text-sm"
                maxLength={1000}
              />
            </div>
          )}
        </TextureSection>

      </div>

      <div className="shrink-0 border-t border-border/70 bg-card p-3">
        <div className="flex flex-col gap-3">
          {state.textureSource !== "description" && (
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
                placeholder="mis. arah urat material, tingkat kilap, atau warna"
                className="min-h-16 resize-none text-sm"
              />
            </div>
          )}
          <Button
            size="sm"
            onClick={onApply}
            disabled={!state.canApply}
            className="w-full gap-1 text-xs [&_svg]:size-3.5"
          >
            {state.applying && <Loader2 className="animate-spin" />}
            Apply Texture
          </Button>
        </div>
      </div>
    </div>
  );
}
