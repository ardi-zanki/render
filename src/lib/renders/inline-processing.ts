import { env } from "@/env";

/**
 * When inline mode is explicitly selected, schedule processing after enqueue.
 * This is a best-effort in-process timer, not a durable execution guarantee.
 * Worker mode leaves execution to the dedicated process (the production default).
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
