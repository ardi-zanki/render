/**
 * DB-backed render worker. Run with:
 *   pnpm render:worker        # continuous
 *   pnpm render:worker --once # process one available job
 */
import { processNextRenderJob } from "@/lib/renders/service";

const once = process.argv.includes("--once");
const workerId = `worker-${process.pid}`;

async function tick() {
  const result = await processNextRenderJob(workerId);
  if (result.processed) {
    console.log("processed", result);
    return true;
  }
  return false;
}

async function main() {
  if (once) {
    await tick();
    return;
  }

  console.log(`Render worker started (${workerId})`);
  for (;;) {
    const processed = await tick();
    await new Promise((resolve) => setTimeout(resolve, processed ? 250 : 2000));
  }
}

main().catch((err) => {
  console.error("Render worker failed:", err);
  process.exit(1);
});
