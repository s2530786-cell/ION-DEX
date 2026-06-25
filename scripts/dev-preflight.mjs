import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { githubDailyDir, getPrivateCoreRoot } from "./ion-private-core-path.mjs";
import { listDiscoveredSkillIds } from "./github-discovered-route.mjs";

const root = process.cwd();

// Files committed to the repo — always enforced (including in CI).
const requiredFiles = [
  "docs/00-engineering-standards.md",
  ".cursor/skills/ion-web3-ui/SKILL.md",
  "docs/05-product-prd.md",
  "docs/06-page-flow-and-user-journeys.md",
  "docs/10-ui-design-route.md",
  "AGENTS.md",
  "SESSION_STATE.md",
];

// Confidential blueprint files kept in .gitignore (铁律27: never pushed to a
// public repo). They exist on local dev machines but never on CI runners, so
// they are validated only when present and skipped gracefully when absent.
const localOnlyFiles = [
  ".memory-bank/overall-design-framework.md",
  ".memory-bank/live-data-reference.md",
  ".memory-bank/implementation-playbook.md",
  ".memory-bank/architecture-audit.md",
  ".memory-bank/security-audit-and-stress-framework.md",
  ".memory-bank/ion-dex-nuke/official-source-index.md",
];

const requiredMarkers = new Map([
  ["docs/00-engineering-standards.md", ["工程交付标准", "前端 UI 验收标准"]],
  [".memory-bank/overall-design-framework.md", ["Overall Design Framework", "Right-Top Avatar / Profile Hub"]],
  [".memory-bank/live-data-reference.md", ["Live Data Reference", "Seven EVM wallet detectors"]],
  [".memory-bank/implementation-playbook.md", ["Implementation Playbook", "Wallet/Profile Integration Order"]],
  [".memory-bank/architecture-audit.md", ["Architecture Audit Memory", "User correction: no empty data or pseudo-code"]],
  [".memory-bank/security-audit-and-stress-framework.md", ["Security Audit And Stress Framework", "Pressure And Chaos Sandbox"]],
  [".memory-bank/ion-dex-nuke/official-source-index.md", ["Official Source Index", "wallet references"]],
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

const uiDebtAllowlist = [
  { file: "frontend/src/hooks/useBridgeDeskData.ts", pattern: /relayerStatus:\s*"mocked"/ },
  { file: "frontend/src/hooks/useDomainDeskData.ts", pattern: /provenance:\s*\{\s*source:\s*"mock"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /source:\s*"mock"\s*\|\s*"cache"\s*\|\s*"upstream"\s*\|\s*"indexer"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /status:\s*"design"\s*\|\s*"mock"\s*\|\s*"paused"\s*\|\s*"online"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /relayerStatus:\s*"mocked"\s*\|\s*"planned"\s*\|\s*"online"\s*\|\s*"degraded"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /proofStatus:\s*"planned"\s*\|\s*"mocked"\s*\|\s*"online"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /status:\s*"mock"\s*\|\s*"planned"/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /source:\s*"mock";$/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /const mockMarketProvenance:/ },
  { file: "frontend/src/lib/ionApi.ts", pattern: /provenance:\s*mockMarketProvenance/ },
  { file: "frontend/src/pages/AiSubscriptionPage.tsx", pattern: /source:\s*source === "live" \? "upstream" : "mock"/ },
  { file: "frontend/src/pages/BusinessPages.tsx", pattern: /status:\s*"mock"/ },
  { file: "frontend/src/pages/BusinessPages.tsx", pattern: /relayerStatus:\s*"mocked"/ },
  { file: "frontend/src/pages/BusinessPages.tsx", pattern: /source:\s*"mock"/ },
  { file: "frontend/src/pages/DashboardPage.tsx", pattern: /source:\s*"mock"/ },
  { file: "frontend/src/pages/DashboardPage.tsx", pattern: /oracleMethod:\s*"mock-single-source"/ },
  { file: "frontend/src/pages/DashboardPage.tsx", pattern: /platformId:\s*"mock"/ },
  { file: "frontend/src/pages/DomainManagePage.tsx", pattern: /source:\s*"mock"/ },
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

function normalizeRelPath(file) {
  return file.split(sep).join("/");
}

function isUiDebtAllowed(file, line) {
  const normalized = normalizeRelPath(file);
  return uiDebtAllowlist.some((entry) => entry.file === normalized && entry.pattern.test(line));
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
    const lines = content.split(/\r?\n/);
    for (const pattern of unfinishedPatterns) {
      lines.forEach((line, index) => {
        if (!pattern.test(line)) {
          return;
        }
        if (isUiDebtAllowed(file, line)) {
          return;
        }
        warnings.push(`${file}:${index + 1}: ${pattern}`);
      });
    }
  }
  return warnings;
}

console.log("=== ION DEX development preflight ===");
for (const file of requiredFiles) {
  readRequiredFile(file);
  console.log(`READ_OK ${file}`);
}

// Confidential blueprint files (.memory-bank/*) live in .gitignore and never
// reach CI runners. Validate them when present, skip gracefully when absent.
for (const file of localOnlyFiles) {
  if (existsSync(join(root, file))) {
    readRequiredFile(file);
    console.log(`READ_OK ${file}`);
  } else {
    console.log(`SKIP_LOCAL_ONLY ${file} (not present — expected on CI)`);
  }
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

const catalogPath = join(githubDailyDir(root), "latest.json");
if (existsSync(catalogPath)) {
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    const ageMs = Date.now() - new Date(catalog.generatedAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      console.log("");
      console.log(
        "GITHUB_DAILY_STALE: catalog older than 24h — run: node scripts/github-daily-discovery.mjs (set GITHUB_TOKEN)",
      );
    }
  } catch {
    console.log("GITHUB_DAILY_WARN: latest.json unreadable — re-run discovery");
  }
} else {
  console.log("");
  console.log(
    "GITHUB_DAILY_MISSING: run node scripts/github-daily-discovery.mjs once (GITHUB_TOKEN recommended)",
  );
}

const skillsPrivate = join(root, ".cursor", "skills-private");
try {
  const item = existsSync(skillsPrivate) ? statSync(skillsPrivate) : null;
  if (!item) {
    console.log("");
    console.log(
      "SKILLS_PRIVATE_MISSING: run ion-private-core/scripts/link-skills-to-ion-dex.ps1 so github-discovered stubs are callable",
    );
  } else {
    const stubs = listDiscoveredSkillIds(root);
    if (stubs.length > 0) {
      console.log(`GITHUB_DISCOVERED_STUBS: ${stubs.length} (skills-private junction OK)`);
    }
  }
} catch {
  /* ignore */
}

if (process.env.ION_SKILL_ROUTE !== "0") {
  console.log("");
  console.log("--- skill-route hint (set ION_SKILL_ROUTE=0 to skip) ---");
  const route = spawnSync(process.execPath, ["scripts/skill-route.mjs", "--git"], {
    cwd: root,
    encoding: "utf8",
  });
  if (route.stdout) process.stdout.write(route.stdout);
  if (route.status !== 0 && route.stderr) console.log(route.stderr);
}
