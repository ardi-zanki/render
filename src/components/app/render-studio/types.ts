import type { RenderConfig, RenderMode, RenderOutputFormat } from "@/db/schema";
import type { RenderListItem } from "@/lib/renders/types";

export type Scene = Pick<RenderListItem, "id" | "mode" | "status" | "resultUrl">;
export type StudioView = "original" | "comparison" | "result";
export type ViewerTab = {
  value: StudioView;
  label: string;
  disabled: boolean;
};

export type RenderStudioProject = { id: string; name: string };

/** A version (result/edit) of the render being edited, for Scene History. */
export type StudioVersion = {
  id: string;
  label: string;
  fileUrl: string;
  config: RenderConfig | null;
};

export type RenderStudioProps = {
  projectId: string;
  projectName: string;
  projects: RenderStudioProject[];
  initialBalance: number;
  initialScenes: Scene[];
  defaultRenderMode?: RenderMode;
  defaultOutputFormat?: RenderOutputFormat;
  initialInstruction?: string;
  /** Pre-fill the studio controls when reopening a render ("Open Studio"). */
  initialConfig?: RenderConfig | null;
  /** Original image URL to load onto the canvas for re-render (no re-upload). */
  initialImageUrl?: string | null;
  /** Previous render result, so the Komparasi/Hasil tabs work on reopen. */
  initialResultUrl?: string | null;
  initialResultRenderId?: string | null;
  /** When set, the studio edits this render in place (new version, 1 credit). */
  sourceRenderId?: string | null;
  /** Editable render name shown in the studio header. */
  initialRenderName?: string;
  /** Version history of the render being edited (Scene History). */
  initialVersions?: StudioVersion[];
  /** Metadata of the render being edited, shown above the Scene panel. */
  renderInfo?: {
    createdAt: string;
    updatedAt: string;
    mode: RenderMode;
    outputFormat: string;
    creditsUsed: number;
    /** Set when the latest version was produced by the texture editor. */
    editKind?: "texture";
  } | null;
};

export type CreateProjectResponse = { id: string; name: string };
export type CreateRenderResponse = {
  renderId: string;
  status?: string;
  balance?: number;
};
export type ShareResponse = { url: string };
export type DownloadTokenResponse = { url: string };
