"use client";

import { useState } from "react";

import {
  BRUSH_DEFAULT,
  TOLERANCE_DEFAULT,
  type MaskState,
  type TextureSource,
  type TextureTool,
} from "./types";

/**
 * State for the region/texture editor: which selection tool is active, brush
 * and magic-wand parameters, the chosen texture (library item or upload), the
 * optional instruction, and a mirror of the canvas selection state (so the
 * toolbar can disable undo/redo and the Apply button knows when a mask exists).
 */
export function useTextureEditState() {
  const [tool, setTool] = useState<TextureTool>("wand");
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT);
  const [tolerance, setTolerance] = useState(TOLERANCE_DEFAULT);

  const [textureSource, setTextureSource] = useState<TextureSource>("library");
  const [selectedTextureId, setSelectedTextureId] = useState<string | null>(null);
  const [textureFile, setTextureFile] = useState<File | null>(null);
  const [texturePreviewUrl, setTexturePreviewUrl] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");

  const [applying, setApplying] = useState(false);
  const [mask, setMask] = useState<MaskState>({
    hasMask: false,
    canUndo: false,
    canRedo: false,
  });

  function pickTextureFile(file: File | null) {
    setTexturePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
    setTextureFile(file);
  }

  /** True once a region is selected and a texture source is chosen. */
  const textureChosen =
    textureSource === "library"
      ? Boolean(selectedTextureId)
      : Boolean(textureFile);
  const canApply = mask.hasMask && textureChosen && !applying;

  return {
    tool,
    setTool,
    brushSize,
    setBrushSize,
    tolerance,
    setTolerance,
    textureSource,
    setTextureSource,
    selectedTextureId,
    setSelectedTextureId,
    textureFile,
    texturePreviewUrl,
    pickTextureFile,
    instruction,
    setInstruction,
    applying,
    setApplying,
    mask,
    setMask,
    canApply,
  };
}

export type TextureEditState = ReturnType<typeof useTextureEditState>;
