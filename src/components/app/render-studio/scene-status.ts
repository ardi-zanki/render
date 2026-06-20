import type { Scene } from "./types";

// Renders the user cancelled or that were refunded carry no visual output and
// no reason to revisit — they are kept out of the scene gallery entirely.
const HIDDEN_STATUSES = new Set<Scene["status"]>(["cancelled", "refunded"]);

export function visibleScenes(scenes: Scene[]): Scene[] {
  return scenes.filter((s) => !HIDDEN_STATUSES.has(s.status));
}

export type SceneTileVariant = "image" | "failed" | "processing" | "placeholder";

/**
 * Decide how a scene tile should render. A scene with a result is always shown
 * as its image; otherwise the status drives a meaningful placeholder so the
 * gallery never shows a blank box. "placeholder" is the neutral fallback for an
 * unexpected state (e.g. success without a result URL).
 */
export function sceneTileVariant(scene: Scene): SceneTileVariant {
  if (scene.resultUrl) return "image";
  if (scene.status === "failed") return "failed";
  if (scene.status === "queued" || scene.status === "processing") {
    return "processing";
  }
  return "placeholder";
}
