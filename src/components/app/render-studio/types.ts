import type { RenderMode, RenderOutputFormat } from "@/db/schema";
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
};

export type CreateProjectResponse = { id: string; name: string };
export type CreateRenderResponse = {
  renderId: string;
  status?: string;
  balance?: number;
};
export type ShareResponse = { url: string };
export type DownloadTokenResponse = { url: string };
