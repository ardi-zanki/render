// Compatibility facade for existing integration callers. Application entry points
// import focused modules directly to keep their dependency graphs explicit.
export {
  LOW_CREDIT_THRESHOLD,
  RENDER_COST,
  getLatestRenderableAsset,
  isFinalRenderStatus,
  isRenderableVersion,
  type CreateRenderParams,
  type CreateRenderResult,
  type ProviderRequestOptions,
  type RenderAssetView,
  type RenderDetail,
  type RenderListItem,
  type UploadedFile,
} from "./types";

export {
  createRender,
  createRenderEdit,
  createRenderTextureEdit,
} from "./create";
export { startInlineRenderProcessing } from "./inline-processing";
export { cancelRenderJob } from "./jobs";
export { listActiveRenderQueue } from "./queue";
export {
  buildPrompt,
  buildTexturePrompt,
  type PromptBase,
  type RenderOptions,
  type TexturePromptOptions,
} from "./prompt";
export { processNextRenderJob, processRenderJob } from "./processor";
export {
  countRenders,
  countUserRenders,
  getRenderDetail,
  getResultAssetForDownload,
  listRenders,
} from "./queries";
export {
  archiveRender,
  deleteRenderPermanently,
  restoreRender,
} from "./archive-delete";
export {
  moveRenderToProject,
  renameRender,
  type MoveRenderProjectResult,
} from "./update";
export { enableShare, getPublicRender } from "./share";
export {
  findLibraryTexture,
  TEXTURE_CATEGORIES,
  TEXTURE_LIBRARY,
  type LibraryTexture,
  type TextureCategory,
} from "./texture-library";
