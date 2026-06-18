import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";
import type { StorageProvider } from "./types";

let client: S3Client | null = null;

function assertR2Config(cfg: {
  accountId: string;
  bucket: string;
  publicUrl?: string;
}) {
  if (!/^[a-f0-9]{32}$/i.test(cfg.accountId)) {
    throw new Error(
      "R2_ACCOUNT_ID tidak valid. Isi dengan Cloudflare Account ID 32 karakter hex, bukan nama bucket, custom domain, atau URL.",
    );
  }

  if (/^https?:\/\//i.test(cfg.bucket) || cfg.bucket.includes("/")) {
    throw new Error(
      "R2_BUCKET_NAME tidak valid. Isi hanya nama bucket R2, tanpa https:// atau path.",
    );
  }

  if (cfg.publicUrl) {
    try {
      new URL(cfg.publicUrl);
    } catch {
      throw new Error(
        "R2_PUBLIC_URL tidak valid. Isi dengan URL publik lengkap, contoh https://cdn.example.com.",
      );
    }
  }
}

function getConfig() {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error(
      "Cloudflare R2 belum dikonfigurasi (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME).",
    );
  }
  const cfg = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET_NAME,
    publicUrl: env.R2_PUBLIC_URL,
  };
  assertR2Config(cfg);
  return cfg;
}

function getClient(): { s3: S3Client; bucket: string } {
  const cfg = getConfig();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return { s3: client, bucket: cfg.bucket };
}

export function createR2Provider(): StorageProvider {
  return {
    name: "r2",

    async putObject({ key, body, contentType }) {
      const { s3, bucket } = getClient();
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return { key, url: this.publicUrl(key) };
    },

    async getSignedDownloadUrl(key, expiresSec = 600) {
      const { s3, bucket } = getClient();
      return getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: expiresSec },
      );
    },

    async deleteObject(key) {
      const { s3, bucket } = getClient();
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    publicUrl(key) {
      const base = env.R2_PUBLIC_URL?.replace(/\/$/, "");
      return base ? `${base}/${key}` : key;
    },
  };
}
