/**
 * Apply (or print) the CORS policy for the Cloudflare R2 bucket.
 *
 * Why this exists: the Render Studio canvas (Magic Wand) reads source pixels
 * via an `<img crossOrigin="anonymous">`. The browser only lets the canvas read
 * those pixels when R2 answers the cross-origin request with the right
 * `Access-Control-Allow-Origin` header. Listing explicit origins (never "*")
 * also makes R2 emit `Vary: Origin`, so a response cached for one origin is not
 * replayed — without headers — to another. That stale-cache mismatch is what
 * forced the hard reloads.
 *
 *   pnpm cors:setup           # apply, then read back and print the live config
 *   pnpm cors:setup --print   # only print the JSON (paste into the dashboard)
 *
 * Allowed origins come from R2_CORS_ORIGINS (comma-separated) when set,
 * otherwise fall back to APP_URL. Pass extra origins as CLI args.
 */
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env } from "@/env";

function resolveOrigins(): string[] {
  const fromEnv = env.R2_CORS_ORIGINS?.split(",") ?? [];
  const fromArgs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const all = [...fromEnv, ...fromArgs, ...(fromEnv.length ? [] : [env.APP_URL])]
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  const unique = [...new Set(all)];
  if (unique.length === 0) {
    throw new Error(
      "Tidak ada origin. Set R2_CORS_ORIGINS (pisahkan dengan koma) atau APP_URL, atau berikan origin sebagai argumen.",
    );
  }
  for (const o of unique) {
    if (!/^https?:\/\//i.test(o)) {
      throw new Error(`Origin tidak valid: "${o}". Sertakan skema, mis. https://app.example.com`);
    }
  }
  return unique;
}

function corsRules(origins: string[]) {
  return [
    {
      AllowedOrigins: origins,
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
      MaxAgeSeconds: 3600,
    },
  ];
}

function getClient() {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Cloudflare R2 belum dikonfigurasi (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME).",
    );
  }
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { s3, bucket };
}

async function main() {
  const origins = resolveOrigins();
  const rules = corsRules(origins);
  const printOnly = process.argv.includes("--print");

  console.log("Origins yang diizinkan:");
  for (const o of origins) console.log(`  - ${o}`);
  console.log("");
  console.log("CORS policy (format dashboard Cloudflare R2):");
  console.log(JSON.stringify(rules, null, 2));

  if (printOnly) return;

  const { s3, bucket } = getClient();
  console.log(`\nMenerapkan ke bucket "${bucket}"...`);
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: rules },
    }),
  );

  const live = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("\n✓ Diterapkan. Konfigurasi aktif di bucket:");
  console.log(JSON.stringify(live.CORSRules, null, 2));
}

main().catch((err) => {
  console.error(`\n✗ Gagal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
