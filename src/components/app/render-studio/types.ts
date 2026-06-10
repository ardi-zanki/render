import type { RenderConfig, RenderMode, RenderOutputFormat } from "@/db/schema";
import type { RenderListItem } from "@/lib/renders/service";

export type Scene = Pick<RenderListItem, "id" | "mode" | "status" | "resultUrl">;
export type StudioView = "asli" | "komparasi" | "hasil";
export type ViewerTab = {
  value: StudioView;
  label: string;
  disabled: boolean;
};

export type RenderStudioProject = { id: string; name: string };

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
};

export type CreateProjectResponse = { id: string; name: string };
export type CreateRenderResponse = {
  renderId: string;
  status?: string;
  balance?: number;
};
export type ShareResponse = { url: string };
export type DownloadTokenResponse = { url: string };
