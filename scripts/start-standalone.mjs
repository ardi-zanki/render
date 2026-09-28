import { spawn } from "node:child_process";
import { mkdir, readlink, symlink } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, process.env.NEXT_DIST_DIR || ".next");
const standaloneDir = resolve(distDir, "standalone");

// Next's standalone output omits public and static assets. Link to the original
// directories so web and worker also share the same local uploads volume.
for (const [target, link] of [
  [resolve(root, "public"), resolve(standaloneDir, "public")],
  [
    resolve(distDir, "static"),
    resolve(standaloneDir, relative(root, distDir), "static"),
  ],
]) {
  await mkdir(resolve(link, ".."), { recursive: true });
  try {
    await symlink(target, link, "dir");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    // An existing directory may be a deliberately copied deployment asset.
    // Reject stale symlinks instead of silently serving another build's assets.
    const existing = await readlink(link).catch(() => null);
    if (existing && resolve(link, "..", existing) !== target) {
      throw new Error(`Standalone asset link points to the wrong location: ${link}`);
    }
  }
}

process.env.NODE_ENV = "production";
process.env.RENDER_PROCESSING_MODE ??= "worker";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const child = spawn(process.execPath, [resolve(standaloneDir, "server.js")], {
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
