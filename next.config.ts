import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone server output → small, portable Docker image (deployment PRD §9).
  output: "standalone",
  // Load Better Auth (and its optional adapters) at runtime instead of letting
  // the bundler statically analyze its internals — avoids a transitive Kysely
  // version mismatch in @better-auth/kysely-adapter (we use the Drizzle adapter).
  serverExternalPackages: [
    "better-auth",
    "@better-auth/kysely-adapter",
    "kysely",
    "sharp",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
