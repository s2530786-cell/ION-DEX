#!/usr/bin/env node
/**
 * ION DEX Skill autopilot — resolve Skills/docs/memory from paths or task text.
 * UTF-8 without BOM. Usage:
 *   node scripts/skill-route.mjs --paths frontend/src/App.tsx
 *   node scripts/skill-route.mjs --task "实现 Kronos K线预测 API"
 *   node scripts/skill-route.mjs --git
 *   node scripts/skill-route.mjs --json
 */
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import { aiCivilizationKernelDir, getPrivateCoreRoot } from "./ion-private-core-path.mjs";
import {
  matchDiscoveredSkills,
  listDiscoveredSkillIds,
  resolveDiscoveredSkillPath,
} from "./github-discovered-route.mjs";

const root = process.cwd();
const manifestPath = join(root, ".cursor", "skill-routing.manifest.json");

function loadManifest() {
  const raw = readFileSync(manifestPath, "utf8");
  return JSON.parse(raw);
}

function normalizePath(p) {
  return relative(root, p).replace(/\\/g, "/");
}

function globMatch(filePath, pattern) {
  const file = filePath.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (pat.endsWith("/**")) {
    return file.startsWith(pat.slice(0, -3)) || file === pat.slice(0, -3).replace(/\/$/, "");
  }
  if (pat.includes("*")) {
    const escaped = pat.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(
      "^" + escaped.replace(/\*\*/g, ":::GLOBSTAR:::").replace(/\*/g, "[^/]*").replace(/:::GLOBSTAR:::/g, ".*") + "$"
    );
    return re.test(file);
  }
  return file === pat;
}

function resolveMemoryBankPath(rel) {
  const priv = getPrivateCoreRoot(root);
  const relNorm = rel.replace(/^ion-private-core\//, "").replace(/^\.\//, "");
  if (priv && relNorm.includes("github-daily")) {
    const abs = join(priv, relNorm);
    if (existsSync(abs)) return { path: abs, source: "private-core" };
  }
  if (relNorm.includes("ai-civilization-kernel")) {
    const kernelDir = aiCivilizationKernelDir(root);
    const kernelTail = relNorm.replace(/^\.memory-bank\/ai-civilization-kernel\/?/, "");
    if (kernelDir) {
      const abs = kernelTail ? join(kernelDir, kernelTail) : join(kernelDir, "full-kernel.md");
      if (existsSync(abs)) return { path: abs, source: "private-core" };
    }
    const pubPointer = join(root, ".memory-bank", "ai-civilization-kernel", "README.md");
    if (existsSync(pubPointer) && !kernelTail) {
      return { path: normalizePath(pubPointer), source: "public-pointer" };
    }
    return { path: rel, source: "missing" };
  }
  const pub = join(root, rel);
  if (existsSync(pub)) return { path: normalizePath(pub), source: "public" };
  return { path: rel, source: "missing" };
}

function resolveSkillPath(skillId, manifest) {
  if (skillId.startsWith("github-discovered-")) {
    const nestedPrivate = join(root, manifest.privateSkillRoot, "github-discovered", skillId, "SKILL.md");
    if (existsSync(nestedPrivate)) {
      return { id: skillId, path: normalizePath(nestedPrivate), source: "private-discovered" };
    }
    const abs = resolveDiscoveredSkillPath(skillId, root);
    if (abs) return { id: skillId, path: abs, source: "private-core-discovered" };
  }
  const privatePath = join(root, manifest.privateSkillRoot, skillId, "SKILL.md");
  if (existsSync(privatePath)) {
    return { id: skillId, path: normalizePath(privatePath), source: "private" };
  }
  const publicPath = join(root, manifest.publicSkillRoot, skillId, "SKILL.md");
  if (existsSync(publicPath)) {
    return { id: skillId, path: normalizePath(publicPath), source: "public" };
  }
  return { id: skillId, path: null, source: "missing" };
}

function matchPathRoutes(files, manifest) {
  const matched = new Map();
  for (const file of files) {
    const norm = normalizePath(file.startsWith(root) ? file : join(root, file));
    for (const route of manifest.pathRoutes) {
      for (const pattern of route.paths) {
        if (globMatch(norm, pattern)) {
          const prev = matched.get(route.id);
          if (!prev || route.priority > prev.priority) {
            matched.set(route.id, { ...route, matchedFile: norm });
          }
        }
      }
    }
  }
  return [...matched.values()].sort((a, b) => b.priority - a.priority);
}

function matchKeywordRoutes(text, manifest) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const route of manifest.keywordRoutes ?? []) {
    const found = route.keywords.some((kw) => lower.includes(kw.toLowerCase()));
    if (found) hits.push(route);
  }
  return hits;
}

function collectDiscoveredSkills(taskText, manifest) {
  const hits = matchDiscoveredSkills(taskText, root);
  const skillIds = new Set();
  const extras = [];
  for (const h of hits) {
    if (h.hasStub && h.path) {
      skillIds.add(h.skillId);
      extras.push({
        id: h.skillId,
        path: h.path.includes(":") ? h.path : normalizePath(h.path),
        source: "github-discovered",
        repo: h.full_name,
      });
    }
    for (const s of h.suggestedSkills ?? []) skillIds.add(s);
  }
  const skills = [...skillIds].map((id) => {
    const resolved = resolveSkillPath(id, manifest);
    if (resolved.path) return resolved;
    const hit = extras.find((e) => e.id === id);
    if (hit) return { id: hit.id, path: hit.path, source: hit.source };
    return resolved;
  });
  return { skills, discoveredHits: hits };
}

function collectSkillsFromRoutes(pathRoutes, keywordRoutes, manifest, taskText = "") {
  const skillIds = new Set(manifest.baseSkills);
  const docs = new Set();
  const memory = new Set();
  const verify = new Set();
  let preflight = false;
  let securityPreflight = false;

  for (const route of pathRoutes) {
    for (const s of route.skills ?? []) skillIds.add(s);
    for (const d of route.docs ?? []) docs.add(d);
    for (const m of route.memoryBank ?? []) memory.add(m);
    for (const v of route.verify ?? []) verify.add(v);
    if (route.preflight) preflight = true;
    if (route.securityPreflight) securityPreflight = true;
  }

  for (const route of keywordRoutes) {
    for (const s of route.skills ?? []) skillIds.add(s);
    for (const s of route.privateSkills ?? []) skillIds.add(s);
    for (const m of route.memoryBank ?? []) memory.add(m);
  }

  let skills = [...skillIds].map((id) => resolveSkillPath(id, manifest));
  let discoveredHits = [];
  if (taskText.trim()) {
    const discovered = collectDiscoveredSkills(taskText, manifest);
    discoveredHits = discovered.discoveredHits;
    const seen = new Set(skills.map((s) => s.id));
    for (const s of discovered.skills) {
      if (!seen.has(s.id) && s.path) {
        skills.push(s);
        seen.add(s.id);
      }
    }
  }
  return {
    skills,
    docs: [...docs],
    memory: [...memory],
    verify: [...verify],
    preflight,
    securityPreflight,
    discoveredHits,
    discoveredStubCount: listDiscoveredSkillIds(root).length,
  };
}

function gitChangedFiles() {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: root, encoding: "utf8" });
    const staged = execSync("git diff --name-only --cached", { cwd: root, encoding: "utf8" });
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: root, encoding: "utf8" });
    const all = `${out}\n${staged}\n${untracked}`.split("\n").map((l) => l.trim()).filter(Boolean);
    return [...new Set(all)];
  } catch {
    return [];
  }
}

function parseArgs(argv) {
  const opts = { paths: [], task: "", git: false, json: false, quiet: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--git") opts.git = true;
    else if (a === "--json") opts.json = true;
    else if (a === "--quiet") opts.quiet = true;
    else if (a === "--task" && argv[i + 1]) opts.task = argv[++i];
    else if (a === "--paths") {
      while (argv[i + 1] && !argv[i + 1].startsWith("--")) opts.paths.push(argv[++i]);
    } else if (!a.startsWith("--")) opts.paths.push(a);
  }
  return opts;
}

function buildResult(manifest, pathRoutes, keywordRoutes, taskText = "") {
  const bundle = collectSkillsFromRoutes(pathRoutes, keywordRoutes, manifest, taskText);
  return {
    version: manifest.version,
    pathRouteIds: pathRoutes.map((r) => r.id),
    keywordRouteIds: keywordRoutes.map((r) => r.id),
    ...bundle,
    autopilotSkill: resolveSkillPath("ion-skill-autopilot", manifest),
    manifest: ".cursor/skill-routing.manifest.json",
  };
}

function printHuman(result) {
  console.log("=== ION Skill Autopilot ===");
  console.log(`path routes: ${result.pathRouteIds.join(", ") || "(none)"}`);
  console.log(`keyword routes: ${result.keywordRouteIds.join(", ") || "(none)"}`);
  console.log("");
  console.log("SKILLS (read SKILL.md before coding):");
  for (const s of result.skills) {
    const flag = s.source === "missing" ? "MISSING" : s.source.toUpperCase();
    console.log(`  [${flag}] ${s.id} -> ${s.path ?? "not installed"}`);
  }
  if (result.docs.length) {
    console.log("\nDOCS:");
    for (const d of result.docs) console.log(`  - ${d}`);
  }
  if (result.memory.length) {
    console.log("\nMEMORY_BANK:");
    for (const m of result.memory) {
      const resolved = resolveMemoryBankPath(m);
      const tag = resolved.source === "private-core" ? "PRIVATE" : resolved.source.toUpperCase();
      console.log(`  [${tag}] ${resolved.path ?? m}`);
    }
  }
  if (result.preflight) console.log("\nPREFLIGHT: node scripts/dev-preflight.mjs");
  if (result.securityPreflight) console.log("SECURITY: node scripts/security-preflight.mjs");
  if (result.verify.length) {
    console.log("\nVERIFY:");
    for (const v of result.verify) console.log(`  - ${v}`);
  }
  if (result.discoveredHits?.length) {
    console.log(`\nGITHUB DISCOVERED (${result.discoveredStubCount ?? 0} stubs installed):`);
    for (const h of result.discoveredHits) {
      const stub = h.hasStub ? "STUB" : "catalog-only";
      console.log(`  [${stub}] ${h.full_name} -> ${h.skillId}`);
    }
    console.log("  Index: .cursor/skills/ion-github-daily-discovery/discovered-index.md");
  }
  console.log("\nRouter: .cursor/skills/ion-skill-autopilot/SKILL.md");
}

function main() {
  if (!existsSync(manifestPath)) {
    console.error("Missing .cursor/skill-routing.manifest.json");
    process.exit(1);
  }
  const manifest = loadManifest();
  const opts = parseArgs(process.argv);

  let files = opts.paths;
  if (opts.git) files = [...files, ...gitChangedFiles()];
  if (files.length === 0 && !opts.task) {
    files = ["frontend/src", "backend/src", "docs"];
  }

  const pathRoutes = files.length ? matchPathRoutes(files, manifest) : [];
  const keywordRoutes = opts.task ? matchKeywordRoutes(opts.task, manifest) : [];
  const result = buildResult(manifest, pathRoutes, keywordRoutes, opts.task);

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else if (!opts.quiet) {
    printHuman(result);
  }

  const missing = result.skills.filter((s) => s.source === "missing");
  if (missing.length > 0 && process.env.ION_SKILL_ROUTE_STRICT === "1") {
    console.error("Strict mode: missing skills:", missing.map((m) => m.id).join(", "));
    process.exit(2);
  }
}

main();
