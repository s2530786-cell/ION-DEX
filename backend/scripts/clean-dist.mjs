import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
