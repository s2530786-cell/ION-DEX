#!/usr/bin/env node
/**
 * Merge discovery query configs by profile (ion-dev | broad | full).
 * UTF-8 without BOM.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const QUERY_FILES = {
  ion: "github-daily-queries.json",
  broad: "github-daily-queries-broad.json",
};

export function loadTaxonomyMeta(cwd = process.cwd()) {
  const p = join(cwd, "scripts", "github-daily-taxonomy.json");
  if (!existsSync(p)) {
    return { version: 1, profiles: { full: { sources: [QUERY_FILES.ion] } }, defaultProfile: "full" };
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

function readQueryFile(cwd, filename) {
  const p = join(cwd, "scripts", filename);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

/**
 * @param {"ion-dev"|"broad"|"full"|string} profile
 */
export function loadDiscoveryConfig(cwd = process.cwd(), profile) {
  const meta = loadTaxonomyMeta(cwd);
  const resolved =
    profile?.trim() ||
    process.env.ION_GITHUB_DISCOVERY_PROFILE?.trim() ||
    meta.defaultProfile ||
    "full";

  const profileDef = meta.profiles?.[resolved];
  if (!profileDef) {
    throw new Error(
      `Unknown discovery profile "${resolved}". Use: ${Object.keys(meta.profiles ?? {}).join(", ")}`,
    );
  }

  const sources = profileDef.sources ?? [QUERY_FILES.ion];
  const byId = new Map();
  const sections = new Map();
  let defaults = { perPage: 8, minStars: 500, sort: "stars", order: "desc" };
  let ionRelevanceTags = [];

  for (const src of sources) {
    const cfg = readQueryFile(cwd, src);
    if (!cfg) continue;
    defaults = { ...defaults, ...(cfg.defaults ?? {}) };
    ionRelevanceTags = [...new Set([...ionRelevanceTags, ...(cfg.ionRelevanceTags ?? [])])];
    for (const sec of cfg.sections ?? []) sections.set(sec.id, sec);
    for (const cat of cfg.categories ?? []) {
      byId.set(cat.id, { ...cat, _sourceFile: src });
    }
  }

  const categories = [...byId.values()];
  return {
    profile: resolved,
    profileLabel: profileDef.label ?? resolved,
    defaults,
    ionRelevanceTags,
    categories,
    categoryCount: categories.length,
    sourceFiles: sources,
    sections: [...sections.values()],
    taxonomyMeta: meta,
  };
}

export function listProfiles(cwd = process.cwd()) {
  const meta = loadTaxonomyMeta(cwd);
  return Object.entries(meta.profiles ?? {}).map(([id, def]) => ({
    id,
    label: def.label,
    sources: def.sources,
  }));
}
