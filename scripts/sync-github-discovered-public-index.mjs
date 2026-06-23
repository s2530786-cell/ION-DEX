#!/usr/bin/env node
/**
 * Publish a safe public index so Cursor/agents can find github-discovered stubs.
 * UTF-8 without BOM.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { buildPublicIndexMarkdown } from "./github-discovered-route.mjs";

const root = process.cwd();
const outPath = join(
  root,
  ".cursor",
  "skills",
  "ion-github-daily-discovery",
  "discovered-index.md",
);

const md = buildPublicIndexMarkdown(root);
mkdirSync(join(outPath, ".."), { recursive: true });
writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${outPath}`);
