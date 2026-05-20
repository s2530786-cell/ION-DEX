import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/00-engineering-standards.md",
  ".cursor/skills/ion-web3-ui/SKILL.md",
  "docs/05-product-prd.md",
  "docs/06-page-flow-and-user-journeys.md",
  "docs/10-ui-design-route.md",
  "AGENTS.md",
  "SESSION_STATE.md",
];

const requiredMarkers = new Map([
  ["docs/00-engineering-standards.md", ["工程交付标准", "前端 UI 验收标准"]],
  [".cursor/skills/ion-web3-ui/SKILL.md", ["premium OKX Web3-style", "No rough placeholder cards"]],
  ["docs/05-product-prd.md", ["Page Requirements", "Dashboard", "Trade"]],
  ["docs/10-ui-design-route.md", ["ION DEX UI Design Route Lock", "Automatic Workflow"]],
  ["AGENTS.md", ["Development Process", "docs/00-engineering-standards.md"]],
]);

const unfinishedPatterns = [
  /\bBuild Checklist\b/i,
  /\bmock(?:ed)?\b/i,
  /\bplaceholder\b/i,
  /\bshell\b/i,
  /\bdraft\b/i,
  /\bTBD\b/i,
];

function readRequiredFile(file) {
  const bytes = readFileSync(join(root, file));
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error(`${file} has a UTF-8 BOM`);
  }
  if (bytes.includes(0)) {
    throw new Error(`${file} contains NUL bytes`);
  }
  const content = bytes.toString("utf8");
  const markers = requiredMarkers.get(file) ?? [];
  for (const marker of markers) {
    if (!content.includes(marker)) {
      throw new Error(`${file} is missing required marker: ${marker}`);
    }
  }
  return content;
}

function listSourceFiles(dir) {
  const full = join(root, dir);
  const entries = readdirSync(full, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(full, entry.name);
    const rel = relative(root, path);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", "build", "coverage", ".git"].includes(entry.name)) {
        continue;
      }
      files.push(...listSourceFiles(rel));
      continue;
    }
    if (entry.isFile() && /\.(tsx?|css|md)$/.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
}

function collectUiDebtWarnings() {
  const frontendSrc = join(root, "frontend", "src");
  try {
    if (!statSync(frontendSrc).isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const warnings = [];
  for (const file of listSourceFiles(`frontend${sep}src`)) {
    const content = readFileSync(join(root, file), "utf8");
    for (const pattern of unfinishedPatterns) {
      if (pattern.test(content)) {
        warnings.push(`${file}: ${pattern}`);
      }
    }
  }
  return warnings;
}

console.log("=== ION DEX development preflight ===");
for (const file of requiredFiles) {
  readRequiredFile(file);
  console.log(`READ_OK ${file}`);
}

const warnings = collectUiDebtWarnings();
if (warnings.length > 0) {
  console.log("");
  console.log("UI_DEBT_WARNINGS:");
  for (const warning of warnings) {
    console.log(`WARN ${warning}`);
  }
  console.log("Set ION_UI_STRICT=1 to turn these warnings into failures.");
  if (process.env.ION_UI_STRICT === "1") {
    throw new Error("UI strict mode failed because unfinished UI copy remains.");
  }
}

console.log("");
console.log("OK - development preflight completed.");
