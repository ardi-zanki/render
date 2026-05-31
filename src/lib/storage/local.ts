import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { env } from "@/env";
import type { StorageProvider } from "./types";

const ROOT = join(process.cwd(), "public", "uploads");

/**
 * Local filesystem storage for dev — writes under public/uploads so Next serves
 * the files at /uploads/<key>. No external reachability, but localhost URLs are
 * reachable by the mock provider on the same machine.
 */
export function createLocalProvider(): StorageProvider {
  return {
    name: "local",
    async putObject({ key, body }) {
      const filePath = join(ROOT, key);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, body);
      return { key, url: this.publicUrl(key) };
    },
    async getSignedDownloadUrl(key) {
      return this.publicUrl(key);
    },
    async deleteObject(key) {
      await unlink(join(ROOT, key)).catch(() => {});
    },
    publicUrl(key) {
      return `${env.APP_URL.replace(/\/$/, "")}/uploads/${key}`;
    },
  };
}
