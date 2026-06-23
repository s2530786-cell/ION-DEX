import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function parseDotEnv(raw: string): void {
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/** Load backend/.env (and optional cwd .env) without extra dependencies. */
export function loadBackendDotEnv(): void {
  const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const candidates = [
    join(backendRoot, ".env"),
    resolve(process.cwd(), "backend", ".env"),
    resolve(process.cwd(), ".env"),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }
    parseDotEnv(readFileSync(envPath, "utf8"));
  }
}
