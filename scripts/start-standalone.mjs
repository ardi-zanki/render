import { spawn } from "node:child_process";

process.env.NODE_ENV = "production";
process.env.RENDER_PROCESSING_MODE ??= "worker";
process.env.HOSTNAME = "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";

const child = spawn(process.execPath, [".next/standalone/server.js"], {
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
