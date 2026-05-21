import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { Pool, PoolClient } from "pg";
import { migrationsDir } from "./config.js";

export type MigrationRow = { id: string };

function listMigrationFiles(driver: "sqlite" | "postgres"): string[] {
  const dir = migrationsDir(driver);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

function migrationId(filename: string): string {
  return filename.replace(/\.sql$/u, "");
}

export function ensureSqliteMigrationsTable(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

export function runSqliteMigrations(db: DatabaseSync): string[] {
  ensureSqliteMigrationsTable(db);
  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row) => (row as MigrationRow).id),
  );
  const appliedNow: string[] = [];
  for (const file of listMigrationFiles("sqlite")) {
    const id = migrationId(file);
    if (applied.has(id)) {
      continue;
    }
    const sql = readFileSync(join(migrationsDir("sqlite"), file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(
      id,
      new Date().toISOString(),
    );
    appliedNow.push(id);
  }
  return appliedNow;
}

async function ensurePostgresMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL
    );
  `);
}

export async function runPostgresMigrations(pool: Pool): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensurePostgresMigrationsTable(client);
    const existing = await client.query<{ id: string }>("SELECT id FROM schema_migrations");
    const applied = new Set(existing.rows.map((row: { id: string }) => row.id));
    const appliedNow: string[] = [];
    for (const file of listMigrationFiles("postgres")) {
      const id = migrationId(file);
      if (applied.has(id)) {
        continue;
      }
      const sql = readFileSync(join(migrationsDir("postgres"), file), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id, applied_at) VALUES ($1, $2)", [
        id,
        new Date().toISOString(),
      ]);
      appliedNow.push(id);
    }
    await client.query("COMMIT");
    return appliedNow;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export const CORE_TABLES = [
  "tokens",
  "markets",
  "pools",
  "swaps",
  "limit_orders",
  "grid_strategies",
  "staking_positions",
  "burn_events",
  "bridge_transfers",
  "domain_records",
  "domain_listings",
  "identity_credentials",
  "treasury_flows",
  "oracle_prices",
  "risk_events",
  "user_profiles",
  "user_wallets",
  "user_preferences",
  "notifications",
  "audit_logs",
] as const;
