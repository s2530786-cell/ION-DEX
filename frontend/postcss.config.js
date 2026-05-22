/**
 * Force Tailwind CSS v3 PostCSS plugin (lib/index.js).
 * Do not use `plugins: { tailwindcss: {} }` — that resolves v4 `dist/lib.js` on broken installs.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const TAILWIND_PKG = join(root, "node_modules", "tailwindcss", "package.json");
const TAILWIND_LIB = join(root, "node_modules", "tailwindcss", "lib", "index.js");

function loadTailwindV3() {
  if (!existsSync(TAILWIND_PKG) || !existsSync(TAILWIND_LIB)) {
    throw new Error(
      "Tailwind CSS v3 not found. In frontend/ run: npm run repair:css",
    );
  }
  const version = JSON.parse(readFileSync(TAILWIND_PKG, "utf8")).version ?? "";
  if (!String(version).startsWith("3.")) {
    throw new Error(
      `tailwindcss@${version} is installed (needs 3.4.19). Run: npm run repair:css`,
    );
  }
  return require(TAILWIND_LIB);
}

export default {
  plugins: [loadTailwindV3(), require("autoprefixer")],
};
