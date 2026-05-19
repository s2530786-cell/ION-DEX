import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type DbDriver = "sqlite" | "postgres" | "disabled";

function resolveBackendRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(join(dir, "db", "migrations", "sqlite"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return process.cwd();
}

const backendRoot = resolveBackendRoot();

export function resolveDbDriver(): DbDriver {
  if (process.env.ION_DB_DISABLED === "1") {
    return "disabled";
  }
  if (process.env.DATABASE_URL?.trim()) {
    return "postgres";
  }
  const explicit = process.env.ION_DB_DRIVER?.trim().toLowerCase();
  if (explicit === "postgres") {
    return "postgres";
  }
  if (explicit === "disabled") {
    return "disabled";
  }
  return "sqlite";
}

export function resolveSqlitePath(): string {
  const configured = process.env.ION_DB_PATH?.trim();
  if (configured) {
    return configured;
  }
  return join(backendRoot, "data", "ion-dex.sqlite");
}

export function resolvePostgresUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for postgres driver");
  }
  return url;
}

export function ensureSqliteDirectory(sqlitePath: string): void {
  mkdirSync(dirname(sqlitePath), { recursive: true });
}

export function shouldAutoMigrate(): boolean {
  const flag = process.env.ION_DB_AUTO_MIGRATE?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") {
    return false;
  }
  return true;
}

export function migrationsDir(driver: "sqlite" | "postgres"): string {
  return join(backendRoot, "db", "migrations", driver);
}
