#!/usr/bin/env node
/**
 * Block staged public-repo files that contain confidential AI kernel IP.
 * UTF-8 without BOM.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const WHITELIST = new Set([
  "docs/ai-sentinel-gateway-contract.md",
  ".memory-bank/ai-civilization-kernel/README.md",
  ".cursor/skills/ion-ai-civilization-kernel/SKILL.md",
  "scripts/check-public-ip-leak.mjs",
]);

const FORBIDDEN_PATTERNS = [
  { id: "full-kernel-file", re: /full-kernel\.md/i },
  { id: "agent-roster-index", re: /agent-roster-index\.md/i },
  { id: "281-expert-roster", re: /281\s*专家编排/i },
  { id: "master-ten-module-map", re: /Master\s*十模块[\s\S]{0,120}映射表/i },
  { id: "vendor-shallow-clone-list", re: /vendor-ion-discovery[\s\S]{0,200}浅克隆/i },
  { id: "comprehensive-audit-report", re: /COMPREHENSIVE_AUDIT_REPORT/i },
  { id: "executive-summary-audit", re: /EXECUTIVE_SUMMARY_12_ROUND/i },
];

function listStagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    if (!out) return [];
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function scanFile(relativePath) {
  const normalized = normalizePath(relativePath);
  if (WHITELIST.has(normalized)) {
    return [];
  }

  const absolute = join(repoRoot, relativePath);
  if (!existsSync(absolute)) {
    return [];
  }

  let content;
  try {
    content = readFileSync(absolute, "utf8");
  } catch {
    return [];
  }

  const hits = [];
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.re.test(content)) {
      hits.push(pattern.id);
    }
  }
  if (/\.memory-bank\/ai-civilization-kernel\.md$/i.test(normalized)) {
    hits.push("legacy-public-full-kernel");
  }
  return hits;
}

const staged = listStagedFiles();
if (staged.length === 0) {
  console.log("check-public-ip-leak: no staged files — skip");
  process.exit(0);
}

const violations = [];
for (const file of staged) {
  const hits = scanFile(file);
  if (hits.length > 0) {
    violations.push({ file: normalizePath(file), hits });
  }
}

if (violations.length > 0) {
  console.error("check-public-ip-leak: BLOCKED confidential content in staged files:");
  for (const item of violations) {
    console.error(`  - ${item.file}: ${item.hits.join(", ")}`);
  }
  console.error(
    "Move full kernel / roster / vendor strategy to ion-private-core before commit.",
  );
  process.exit(1);
}

console.log(`check-public-ip-leak: OK (${staged.length} staged file(s) scanned)`);
process.exit(0);
