#!/usr/bin/env node
/**
 * Load GitHub API token from env or scripts/.github-token.local (gitignored).
 * UTF-8 without BOM. Never log the token value.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const localPath = join(process.cwd(), "scripts", ".github-token.local");

export function loadGitHubToken() {
  const fromEnv = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
  if (fromEnv.trim()) return fromEnv.trim();

  if (!existsSync(localPath)) return "";

  const raw = readFileSync(localPath, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));

  if (!raw) return "";

  let token = raw;
  if (/^GITHUB_TOKEN\s*=/i.test(token)) token = token.replace(/^GITHUB_TOKEN\s*=/i, "").trim();
  if (/^GH_TOKEN\s*=/i.test(token)) token = token.replace(/^GH_TOKEN\s*=/i, "").trim();
  token = token.replace(/^["']|["']$/g, "").trim();
  return token;
}

const isCli = process.argv[1]?.replace(/\\/g, "/").endsWith("load-github-token.mjs");
if (isCli) {
  const t = loadGitHubToken();
  if (t) {
    console.log("GITHUB_TOKEN: loaded (value hidden)");
    process.exit(0);
  }
  if (existsSync(localPath)) {
    console.log("GITHUB_TOKEN: not set");
    console.log("  scripts/.github-token.local exists but has no token line.");
    console.log("  Add ONE line: ghp_... or github_pat_... (from https://github.com/settings/tokens/new )");
    console.log("  Do not paste the example text github_pat_xxxxxxxx — use your real token.");
  } else {
    console.log("GITHUB_TOKEN: not set");
    console.log("  Create scripts/.github-token.local (copy from github-daily-token.local.example)");
  }
  process.exit(1);
}
