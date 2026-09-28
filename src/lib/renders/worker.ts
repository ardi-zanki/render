import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { processNextRenderJob } from "./processor";

/** Poll until stopped. An abort stops polling, but lets the current job finish. */
export async function runRenderWorker({
  once = false,
  signal,
  workerId = `worker-${randomUUID()}`,
}: {
  once?: boolean;
  signal?: AbortSignal;
  workerId?: string;
} = {}) {
  while (!signal?.aborted) {
    const result = await processNextRenderJob(workerId);
    if (result.processed) console.log("processed", result);
    if (once || signal?.aborted) return;

    try {
      await sleep(result.processed ? 250 : 2000, undefined, { signal });
    } catch (error) {
      if (!signal?.aborted) throw error;
    }
  }
}
