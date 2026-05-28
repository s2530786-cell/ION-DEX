#!/usr/bin/env node
/**
 * Rank repos from private github-daily catalog (shared by top + stubs).
 * UTF-8 without BOM.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { githubDailyDir } from "./ion-private-core-path.mjs";

export const NOISE_FULL_NAMES = new Set([
  "public-apis/public-apis",
  "GitHubDaily/GitHubDaily",
  "offciercia/Defi-Developer-Road-Map",
  "smartcontractkit/full-blockchain-solidity-course-js",
  "bkrem/awesome-solidity",
  "hacksider/Deep-Live-Cam",
  "deepfakes/faceswap",
  "iperov/DeepFaceLab",
]);

/** Curated DEX list category — separate from broad dev discovery. */
export const DEX_ONLY_CATEGORY_IDS = new Set(["web3-dex-curated"]);

export function isNoiseRepo(repo) {
  if (!repo?.full_name) return true;
  if (NOISE_FULL_NAMES.has(repo.full_name)) return true;
  const name = repo.name.toLowerCase();
  const desc = (repo.description ?? "").toLowerCase();
  if (/^awesome-/.test(name) && /list|collection|curated|resources/.test(desc)) return true;
  if (/road-?map|course|tutorial|awesome-list/.test(name) && repo.stars < 15000) return true;
  if (/deepfake|face\s*swap|deep-live-cam|faceswap/.test(`${name} ${desc}`)) return true;
  return false;
}

export function collectCategoryRepos(report, { excludeDexCurated = false } = {}) {
  const out = [];
  for (const cat of report.categories ?? []) {
    if (excludeDexCurated && DEX_ONLY_CATEGORY_IDS.has(cat.id)) continue;
    if (cat.repos?.length) out.push(...cat.repos);
  }
  return out;
}

export function dedupeByStars(repos, { filterNoise = true } = {}) {
  const map = new Map();
  for (const r of repos) {
    if (filterNoise && isNoiseRepo(r)) continue;
    const prev = map.get(r.full_name);
    if (!prev || r.stars > prev.stars) map.set(r.full_name, r);
  }
  return [...map.values()].sort((a, b) => b.stars - a.stars);
}

/**
 * @param {"overall"|"all-dev"|"dex-curated"} scope
 */
export function poolForScope(report, scope) {
  if (scope === "dex-curated") {
    return report.categories?.find((c) => c.id === "web3-dex-curated")?.repos ?? [];
  }
  if (scope === "all-dev") {
    return collectCategoryRepos(report, { excludeDexCurated: true });
  }
  return report.topOverall ?? [];
}

export function rankFromCatalog(cwd, { limit = 5, scope = "all-dev", filterNoise = true } = {}) {
  const latestPath = join(githubDailyDir(cwd), "latest.json");
  if (!existsSync(latestPath)) {
    throw new Error("Missing catalog. Run: node scripts/github-daily-discovery.mjs");
  }
  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const ranked = dedupeByStars(poolForScope(report, scope), { filterNoise }).slice(0, limit);
  return { report, ranked };
}

function limitForCategory(catId, stubConfig) {
  const per = stubConfig.categoryLimits?.[catId];
  if (typeof per === "number" && per > 0) return per;
  if (stubConfig.includeAllCategoryIds?.includes(catId)) return Number.MAX_SAFE_INTEGER;
  return stubConfig.limitPerCategory ?? stubConfig.limit ?? 5;
}

/**
 * Top N per discovery category (全品类) — each category keeps its own useful leaders.
 */
export function rankPerCategoryTop(cwd, stubConfig = {}) {
  const latestPath = join(githubDailyDir(cwd), "latest.json");
  if (!existsSync(latestPath)) {
    throw new Error("Missing catalog. Run: node scripts/github-daily-discovery.mjs");
  }
  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const filterNoise = stubConfig.filterNoise !== false;
  const exclude = new Set(stubConfig.excludeCategoryIds ?? []);
  const includeOnly = stubConfig.includeCategoryIds?.length
    ? new Set(stubConfig.includeCategoryIds)
    : null;
  const minStars = stubConfig.minStarsPerCategory ?? 0;

  const byCategory = [];
  const nameSet = new Set();

  for (const cat of report.categories ?? []) {
    if (exclude.has(cat.id)) continue;
    if (includeOnly && !includeOnly.has(cat.id)) continue;

    let repos = [...(cat.repos ?? [])];
    if (filterNoise) repos = repos.filter((r) => !isNoiseRepo(r));
    if (minStars > 0) repos = repos.filter((r) => (r.stars ?? 0) >= minStars);
    repos.sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0));

    const cap = limitForCategory(cat.id, stubConfig);
    const top = repos.slice(0, cap);
    if (top.length === 0) continue;

    byCategory.push({
      categoryId: cat.id,
      label: cat.label ?? cat.id,
      repos: top,
    });
    for (const r of top) nameSet.add(r.full_name);
  }

  return {
    report,
    byCategory,
    fullNames: [...nameSet],
    totalRepos: nameSet.size,
  };
}

export function resolveStubRepoList(cwd, stubConfig) {
  const extra = stubConfig?.extraRepos ?? [];

  if (stubConfig?.mode === "catalog-top-per-category") {
    const { fullNames } = rankPerCategoryTop(cwd, stubConfig);
    return [...new Set([...fullNames, ...extra])];
  }

  if (stubConfig?.mode === "catalog-top") {
    const limit = stubConfig.limit ?? 5;
    const scope = stubConfig.scope ?? "all-dev";
    const { ranked } = rankFromCatalog(cwd, {
      limit,
      scope,
      filterNoise: stubConfig.filterNoise !== false,
    });
    return [...new Set([...ranked.map((r) => r.full_name), ...extra])];
  }

  return stubConfig?.repos ?? [];
}
