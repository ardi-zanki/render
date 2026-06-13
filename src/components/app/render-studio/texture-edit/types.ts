/** Tools for selecting the region (mask) to texture-edit. */
export type TextureTool =
  | "wand"
  | "lasso"
  | "brush-add"
  | "brush-erase"
  | "pan";

/** Where the chosen texture comes from. */
export type TextureSource = "library" | "upload";

/** Live selection state the canvas reports up to drive the toolbar/Apply. */
export type MaskState = {
  hasMask: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

/** Imperative handle the studio uses to drive the canvas from the toolbar. */
export type MaskCanvasHandle = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  /** Export the current selection as a black/white PNG sized to the source. */
  toMaskBlob: () => Promise<Blob | null>;
};

export const BRUSH_MIN = 5;
export const BRUSH_MAX = 200;
export const BRUSH_DEFAULT = 50;
export const TOLERANCE_DEFAULT = 30;
