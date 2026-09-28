/**
 * Queue process entry point: pnpm worker [--once].
 * Runtime env is loaded by the package script; queue logic lives in src/lib/renders.
 */
import { dbClient } from "@/db";
import { runRenderWorker } from "@/lib/renders/worker";

const shutdown = new AbortController();
const once = process.argv.includes("--once");

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    console.log(`${signal}: stopping after the current render job finishes`);
    shutdown.abort();
  });
}

if (!once) console.log("Render worker started");

runRenderWorker({ once, signal: shutdown.signal })
  .finally(() => dbClient.end({ timeout: 5 }))
  .catch((error) => {
    console.error("Render worker failed:", error);
    process.exitCode = 1;
  });
