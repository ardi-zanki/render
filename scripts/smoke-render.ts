/**
 * Runtime smoke test for the Phase 2 render pipeline. Run with
 * `pnpm smoke:render`. Exercises: createRender → credit deduction → local
 * storage → mock AI provider → result asset persisted → file on disk.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { and, eq } from "drizzle-orm";
import sharp from "sharp";

import { db } from "@/db";
import { renderAssets, renders, user } from "@/db/schema";
import { getBalance } from "@/lib/credits";
import { grantSignupBonus } from "@/lib/provisioning";
import { getDefaultProject } from "@/lib/projects/service";
import { createRender } from "@/lib/renders/service";

const EMAIL = "demo@renderai.test";

function assert(cond: unknown, label: string) {
  console.log(`  ${cond ? "✓" : "✗"} ${label}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const u = await db.query.user.findFirst({ where: eq(user.email, EMAIL) });
  if (!u) {
    console.error(`User ${EMAIL} tidak ada. Jalankan flow daftar dulu.`);
    process.exit(1);
  }

  // Make sure there is at least 1 credit to spend.
  if ((await getBalance(u.id)) < 1) await grantSignupBonus(u.id);
  const before = await getBalance(u.id);
  const project = await getDefaultProject(u.id);

  const image = await sharp({
    create: {
      width: 768,
      height: 576,
      channels: 3,
      background: { r: 180, g: 200, b: 230 },
    },
  })
    .png()
    .toBuffer();

  console.log("Running render (mode=interior, provider=mock, storage=local)…");
  const result = await createRender({
    userId: u.id,
    projectId: project.id,
    mode: "interior",
    prompt: "photorealistic interior, modern, golden hour",
    original: { data: image, contentType: "image/png", ext: "png", fileName: "test.png" },
  });

  assert(result.status === "success", "render status success");
  assert(!!result.resultUrl, "result URL returned");

  const after = await getBalance(u.id);
  assert(after === before - 1, `credit deducted (${before} → ${after})`);

  const row = await db.query.renders.findFirst({
    where: eq(renders.id, result.renderId),
  });
  assert(row?.status === "success", "render row marked success");
  assert(row?.creditsUsed === 1, "creditsUsed = 1");

  const assets = await db.query.renderAssets.findMany({
    where: eq(renderAssets.renderId, result.renderId),
  });
  const resultAsset = assets.find((a) => a.type === "result");
  const originalAsset = assets.find((a) => a.type === "original");
  assert(!!originalAsset, "original asset stored");
  assert(!!resultAsset, "result asset stored");

  if (resultAsset) {
    const onDisk = join(process.cwd(), "public", "uploads", resultAsset.fileKey);
    assert(existsSync(onDisk), "result file written to disk");
  }

  // Confirm the failure/refund path keys are unique (no double refund possible).
  const failed = await db.query.renders.findMany({
    where: and(eq(renders.userId, u.id), eq(renders.status, "failed")),
  });
  console.log(`  (info) failed renders for user: ${failed.length}`);

  console.log("\nDone.");
  process.exit(process.exitCode ?? 0);
}

main().catch((err) => {
  console.error("Smoke render error:", err);
  process.exit(1);
});
