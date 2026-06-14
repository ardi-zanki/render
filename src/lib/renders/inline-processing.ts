import { env } from "@/env";

/**
 * Local-development convenience: when render processing runs inline, kick the
 * worker after the request commits the render row. Production keeps this a no-op
 * because the dedicated worker process owns the queue.
 */
export function startInlineRenderProcessing(
  renderId: string,
  userId: string,
  failureMessage = "Background render job gagal:",
) {
  if (env.RENDER_PROCESSING_MODE !== "inline") return;

  setTimeout(() => {
    void import("./processor")
      .then(({ processRenderJob }) => processRenderJob(renderId, `api-${userId}`))
      .catch((err) => {
        console.error(failureMessage, err);
      });
  }, 0);
}
