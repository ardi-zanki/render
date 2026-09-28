import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-plugin-react detection still calls an API removed in ESLint 10.
// Read the installed version directly so upgrades do not leave a stale pin.
const require = createRequire(import.meta.url);
const reactVersion = require("react/package.json").version;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: {
      react: {
        version: reactVersion,
        defaultVersion: reactVersion,
      },
    },
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: [
            "@/db", "@/db/**", "@/env", "@/lib/**", "@/app/**",
            "@/components/**", "@/hooks/**", "next", "next/**",
            "drizzle-orm", "drizzle-orm/**", "node:*",
          ],
          message: "Domain contracts must stay independent of framework, UI, and infrastructure modules.",
        }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
