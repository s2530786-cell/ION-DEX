#!/usr/bin/env node
/**
 * Print top-N repos by stars from private github-daily catalog.
 * UTF-8 without BOM.
 *
 *   node scripts/github-daily-top.mjs
 *   node scripts/github-daily-top.mjs --limit 5 --scope all-dev
 *   node scripts/github-daily-top.mjs --per-category --limit 5
 */
import { rankFromCatalog, rankPerCategoryTop } from "./github-daily-rank.mjs";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function loadStubConfig(cwd) {
  const p = join(cwd, "scripts", "github-daily-stub-repos.json");
  if (!existsSync(p)) return { mode: "catalog-top-per-category", limitPerCategory: 5 };
  return JSON.parse(readFileSync(p, "utf8"));
}

function parseArgs(argv) {
  const opts = { limit: 5, scope: "all-dev", perCategory: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) opts.limit = Number(argv[++i]);
    else if (argv[i] === "--scope" && argv[i + 1]) opts.scope = argv[++i];
    else if (argv[i] === "--per-category") opts.perCategory = true;
  }
  return opts;
}

function main() {
  const cwd = process.cwd();
  const opts = parseArgs(process.argv);

  if (opts.perCategory) {
    const stubCfg = loadStubConfig(cwd);
    stubCfg.limitPerCategory = opts.limit;
    const { report, byCategory, totalRepos } = rankPerCategoryTop(cwd, stubCfg);

    console.log(`# Top ${opts.limit} per category (全品类)`);
    console.log(`Generated: ${report.generatedAt} · token: ${report.usedToken ? "yes" : "no"}`);
    console.log(`Categories with hits: ${byCategory.length} · unique repos: ${totalRepos}`);
    console.log("");

    for (const block of byCategory) {
      console.log(`## ${block.categoryId} — ${block.label}`);
      block.repos.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.stars}★  ${r.full_name}`);
        console.log(`     ${r.html_url}`);
      });
      console.log("");
    }
    return;
  }

  const { report, ranked } = rankFromCatalog(cwd, opts);

  console.log(`# Top ${opts.limit} by stars (${opts.scope})`);
  console.log(`Generated: ${report.generatedAt} · token: ${report.usedToken ? "yes" : "no"}`);
  console.log(`Categories in catalog: ${(report.categories ?? []).length}`);
  console.log("");
  ranked.forEach((r, i) => {
    console.log(`${i + 1}. ${r.stars}★  ${r.full_name}`);
    console.log(`   ${r.categoryId} — ${r.description || "(no description)"}`);
    console.log(`   ${r.html_url}`);
    console.log("");
  });
}

main();
