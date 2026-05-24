/**
 * Ensures Tailwind CSS v3 (lib/index.js) is installed — not v4 (dist/lib.js).
 * Vite/PostCSS fail when package.json points at v4 but dist/ is missing or corrupt.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TAILWIND_PKG = join(FRONTEND_ROOT, "node_modules", "tailwindcss", "package.json");
const TAILWIND_LIB = join(FRONTEND_ROOT, "node_modules", "tailwindcss", "lib", "index.js");
const REQUIRED = "3.4.19";

function tailwindV3Ok() {
  if (!existsSync(TAILWIND_PKG) || !existsSync(TAILWIND_LIB)) {
    return false;
  }
  try {
    const pkg = JSON.parse(readFileSync(TAILWIND_PKG, "utf8"));
    return typeof pkg.version === "string" && pkg.version.startsWith("3.");
  } catch {
    return false;
  }
}

if (!tailwindV3Ok()) {
  const tailwindDir = join(FRONTEND_ROOT, "node_modules", "tailwindcss");
  if (existsSync(tailwindDir)) {
    rmSync(tailwindDir, { recursive: true, force: true });
  }
  console.log(`[ensure-tailwind-v3] Installing tailwindcss@${REQUIRED} (v4 dist/lib.js breaks PostCSS)…`);
  execSync(`npm install tailwindcss@${REQUIRED} --save-dev --no-fund --no-audit --legacy-peer-deps`, {
    cwd: FRONTEND_ROOT,
    stdio: "inherit",
  });
  if (!tailwindV3Ok()) {
    console.error(
      "[ensure-tailwind-v3] Still broken. Run: Remove-Item -Recurse -Force node_modules; npm install",
    );
    process.exit(1);
  }
  console.log("[ensure-tailwind-v3] OK");
}
