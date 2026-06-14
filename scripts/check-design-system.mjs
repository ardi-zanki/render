import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const TARGET_DIRS = ["src/app", "src/components"];
const FILE_EXTENSIONS = new Set([".ts", ".tsx"]);

const BANNED_PATTERNS = [
  {
    pattern: /\bshadow-(sm|md|lg|xl|2xl)\b/g,
    message:
      "Use project shadow tokens: shadow-hairline, shadow-soft, shadow-floating, shadow-elevated, or shadow-dialog.",
  },
  {
    pattern: /\bshadow-\[/g,
    message: "Avoid arbitrary shadow values; add a named shadow token if needed.",
  },
  {
    pattern: /\brounded-(xl|2xl|3xl)\b/g,
    message: "Use compact radius tokens unless the component contract allows larger radius.",
  },
  {
    pattern:
      /\b(bg|text|border|ring|from|to|via)-(white|black|slate|gray|neutral|zinc|stone|blue|red|green|yellow|amber|orange|purple|violet|indigo|cyan|teal|sky)-/g,
    message:
      "Use design-system color tokens such as bg-card, text-foreground, border-border, or semantic tokens.",
  },
];

async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listSourceFiles(fullPath);
      if (FILE_EXTENSIONS.has(path.extname(entry.name))) return [fullPath];
      return [];
    }),
  );
  return nested.flat();
}

function findViolations(file, content) {
  const violations = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    for (const { pattern, message } of BANNED_PATTERNS) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        violations.push({
          file,
          line: index + 1,
          column: (match.index ?? 0) + 1,
          match: match[0],
          message,
        });
      }
    }
  });

  return violations;
}

const files = (await Promise.all(TARGET_DIRS.map(listSourceFiles))).flat();
const violations = (
  await Promise.all(
    files.map(async (file) => findViolations(file, await readFile(file, "utf8"))),
  )
).flat();

if (violations.length > 0) {
  console.error("Design system guard found unsupported utility classes:\n");
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} ${violation.match}`,
    );
    console.error(`  ${violation.message}`);
  }
  process.exitCode = 1;
} else {
  console.log("Design system guard passed.");
}
