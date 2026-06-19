import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright can use an isolated cache so E2E does not collide with a
  // developer's running `.next/dev/lock`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
  outputFileTracingIncludes: {
    "/*": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
