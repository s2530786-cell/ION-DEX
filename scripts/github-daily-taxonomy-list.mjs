#!/usr/bin/env node
/**
 * List discovery profiles and category counts (no API calls).
 * UTF-8 without BOM.
 */
import { loadDiscoveryConfig, listProfiles } from "./github-daily-load-queries.mjs";

const cwd = process.cwd();
const profiles = listProfiles(cwd);

console.log("# GitHub discovery taxonomy\n");
for (const p of profiles) {
  const cfg = loadDiscoveryConfig(cwd, p.id);
  const bySection = new Map();
  for (const c of cfg.categories) {
    const sec = c.section ?? "ion-dev";
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec).push(c.id);
  }
  console.log(`## Profile: ${p.id}`);
  console.log(`Label: ${p.label}`);
  console.log(`Sources: ${cfg.sourceFiles.join(", ")}`);
  console.log(`Categories: ${cfg.categoryCount}`);
  console.log("");
  for (const [sec, ids] of [...bySection.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`### ${sec} (${ids.length})`);
    for (const id of ids) console.log(`  - ${id}`);
    console.log("");
  }
}
