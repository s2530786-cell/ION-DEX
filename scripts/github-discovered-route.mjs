#!/usr/bin/env node
/**
 * Resolve github-discovered/* Skill stubs for skill-route and agents.
 * UTF-8 without BOM.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { githubDailyDir, getPrivateCoreRoot, privateSkillsRoot } from "./ion-private-core-path.mjs";
import { rankFromCatalog, rankPerCategoryTop, isNoiseRepo } from "./github-daily-rank.mjs";

export function discoveredSkillsDir(cwd = process.cwd()) {
  const privSkills = privateSkillsRoot(cwd);
  if (privSkills) {
    const nested = join(privSkills, "github-discovered");
    if (existsSync(nested)) return nested;
  }
  const priv = getPrivateCoreRoot(cwd);
  if (priv) {
    const nested = join(priv, ".cursor", "skills", "github-discovered");
    if (existsSync(nested)) return nested;
  }
  return null;
}

export function listDiscoveredSkillIds(cwd = process.cwd()) {
  const dir = discoveredSkillsDir(cwd);
  if (!dir) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("github-discovered-"))
    .filter((e) => existsSync(join(dir, e.name, "SKILL.md")))
    .map((e) => e.name)
    .sort();
}

export function resolveDiscoveredSkillPath(skillId, cwd = process.cwd()) {
  const dir = discoveredSkillsDir(cwd);
  if (!dir) return null;
  const md = join(dir, skillId, "SKILL.md");
  return existsSync(md) ? md : null;
}

function loadStubConfig(cwd) {
  const p = join(cwd, "scripts", "github-daily-stub-repos.json");
  if (!existsSync(p)) return { mode: "catalog-top-per-category", limitPerCategory: 5 };
  return JSON.parse(readFileSync(p, "utf8"));
}

function catalogRepos(cwd) {
  const latestPath = join(githubDailyDir(cwd), "latest.json");
  if (!existsSync(latestPath)) return [];
  const stubCfg = loadStubConfig(cwd);
  const map = new Map();

  if (stubCfg.mode === "catalog-top-per-category") {
    const { byCategory } = rankPerCategoryTop(cwd, stubCfg);
    for (const block of byCategory) {
      for (const r of block.repos) map.set(r.full_name, r);
    }
    return [...map.values()];
  }

  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const top = rankFromCatalog(cwd, { limit: 50, scope: "all-dev", filterNoise: true }).ranked;
  for (const r of top) map.set(r.full_name, r);
  for (const cat of report.categories ?? []) {
    for (const r of cat.repos ?? []) {
      if (isNoiseRepo(r)) continue;
      if (!map.has(r.full_name) || r.stars > map.get(r.full_name).stars) {
        map.set(r.full_name, r);
      }
    }
  }
  return [...map.values()];
}

function blobForRepo(repo) {
  return [
    repo.full_name,
    repo.name,
    repo.description ?? "",
    repo.categoryId ?? "",
    ...(repo.topics ?? []),
    ...(repo.suggestedSkills ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Match task text to github-discovered skill ids (Top catalog + installed stubs).
 */
export function matchDiscoveredSkills(taskText, cwd = process.cwd()) {
  const lower = (taskText ?? "").toLowerCase();
  if (!lower.trim()) return [];

  const stubIds = new Set(listDiscoveredSkillIds(cwd));
  const hits = [];

  for (const repo of catalogRepos(cwd)) {
    const slug = `github-discovered-${repo.full_name.replace(/\//g, "-").toLowerCase()}`;
    const skillId = stubIds.has(slug) ? slug : null;
    const [owner = "", repoName = ""] = repo.full_name.toLowerCase().split("/");
    const needles = [
      repo.full_name.toLowerCase(),
      repo.name.toLowerCase(),
      owner,
      repoName,
      ...(repo.topics ?? []).map((t) => t.toLowerCase()),
      ...(repo.suggestedSkills ?? []).map((t) => t.toLowerCase()),
    ];
    const matched = needles.some((n) => n.length > 2 && lower.includes(n));
    if (!matched) continue;

    const path = skillId ? resolveDiscoveredSkillPath(skillId, cwd) : null;
    hits.push({
      skillId: skillId ?? slug,
      full_name: repo.full_name,
      stars: repo.stars,
      categoryId: repo.categoryId,
      path,
      hasStub: Boolean(path),
      suggestedSkills: repo.suggestedSkills ?? [],
    });
  }

  // Direct mention of github-discovered-* skill folder name
  for (const id of stubIds) {
    if (lower.includes(id) || lower.includes(id.replace(/^github-discovered-/, ""))) {
      if (!hits.some((h) => h.skillId === id)) {
        hits.push({
          skillId: id,
          full_name: id.replace(/^github-discovered-/, "").replace(/-/g, "/"),
          stars: 0,
          categoryId: "stub",
          path: resolveDiscoveredSkillPath(id, cwd),
          hasStub: true,
          suggestedSkills: [],
        });
      }
    }
  }

  const matchedWithStub = hits.filter((h) => h.hasStub);
  const pool = matchedWithStub.length ? matchedWithStub : hits;
  return pool.sort((a, b) => b.stars - a.stars).slice(0, 12);
}

export function buildPublicIndexMarkdown(cwd = process.cwd()) {
  const stubIds = listDiscoveredSkillIds(cwd);
  const stubCfg = loadStubConfig(cwd);
  const { byCategory, totalRepos } = rankPerCategoryTop(cwd, stubCfg);
  const lines = [
    "# GitHub Discovered Skills — live index",
    "",
    "Auto-generated by `node scripts/sync-github-discovered-public-index.mjs` (daily pipeline).",
    "Mode: per-category Top 5 (`catalog-top-per-category`); discovery profile `full` = ION + GitHub-wide taxonomy (~89 categories).",
    "Full stubs live in **ion-private-core**; load via junction `.cursor/skills-private/`.",
    "",
    "## How agents load these",
    "",
    "1. `node scripts/skill-route.mjs --task \"<your task>\"` — matches repo names / topics.",
    "2. Read matching `SKILL.md` under `.cursor/skills-private/github-discovered/<id>/`.",
    "3. Keywords `github发现`, `vendor-ion-discovery`, repo names also hit `kw-github-daily`.",
    "",
    `## Stubs installed (${stubIds.length} skills · ${totalRepos} repos in catalog selection)`,
    "",
  ];
  for (const id of stubIds) {
    lines.push(`- \`${id}\``);
  }
  lines.push("", "## Per-category Top (stub source)", "");
  for (const block of byCategory) {
    lines.push(`### ${block.categoryId}`);
    for (const r of block.repos) {
      lines.push(`- ${r.stars}★ \`${r.full_name}\``);
    }
    lines.push("");
  }
  return lines.join("\n");
}
