import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import {
  ensureSqliteDirectory,
  resolveDbDriver,
  resolvePostgresUrl,
  resolveSqlitePath,
  shouldAutoMigrate,
  type DbDriver,
} from "./config.js";
import { CORE_TABLES, runPostgresMigrations, runSqliteMigrations } from "./migrate.js";

export type DatabaseHealth = {
  driver: DbDriver;
  status: "ok" | "disabled" | "error";
  path?: string;
  migrationsApplied: string[];
  tableCount?: number;
  message?: string;
};

let sqliteDb: DatabaseSync | null = null;
let sqlitePathOpened: string | null = null;
let postgresPool: pg.Pool | null = null;
let lastHealth: DatabaseHealth = {
  driver: "disabled",
  status: "disabled",
  migrationsApplied: [],
};

function countSqliteTables(db: DatabaseSync): number {
  const placeholders = CORE_TABLES.map(() => "?").join(", ");
  const row = db
    .prepare(
      `SELECT COUNT(*) AS count FROM sqlite_master
       WHERE type = 'table' AND name IN (${placeholders})`,
    )
    .get(...CORE_TABLES) as { count: number };
  return row.count;
}

async function countPostgresTables(pool: pg.Pool): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [CORE_TABLES],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export function bootstrapDatabase(): DatabaseHealth {
  const driver = resolveDbDriver();
  if (driver === "disabled") {
    lastHealth = { driver, status: "disabled", migrationsApplied: [] };
    return lastHealth;
  }
  if (driver === "postgres") {
    lastHealth = {
      driver,
      status: "ok",
      migrationsApplied: [],
      message: "Use bootstrapDatabaseAsync() for postgres",
    };
    return lastHealth;
  }

  try {
    const path = resolveSqlitePath();
    if (sqliteDb && lastHealth.path === path && lastHealth.status === "ok") {
      return { ...lastHealth, migrationsApplied: [] };
    }
    if (sqliteDb) {
      try {
        sqliteDb.close();
      } catch {
        /* Windows may still hold the handle briefly */
      }
      sqliteDb = null;
    }
    if (path !== ":memory:") {
      ensureSqliteDirectory(path);
    }
    sqliteDb = new DatabaseSync(path);
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
    const migrationsApplied = shouldAutoMigrate() ? runSqliteMigrations(sqliteDb) : [];
    lastHealth = {
      driver: "sqlite",
      status: "ok",
      path,
      migrationsApplied,
      tableCount: countSqliteTables(sqliteDb),
    };
    return lastHealth;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastHealth = {
      driver: "sqlite",
      status: "error",
      migrationsApplied: [],
      message,
    };
    return lastHealth;
  }
}

async function bootstrapPostgresAsync(): Promise<DatabaseHealth> {
  const pool = postgresPool;
  if (!pool) {
    throw new Error("Postgres pool is not initialized");
  }
  const migrationsApplied = shouldAutoMigrate() ? await runPostgresMigrations(pool) : [];
  const tableCount = await countPostgresTables(pool);
  lastHealth = {
    driver: "postgres",
    status: "ok",
    migrationsApplied,
    tableCount,
  };
  return lastHealth;
}

export async function bootstrapDatabaseAsync(): Promise<DatabaseHealth> {
  const driver = resolveDbDriver();
  if (driver === "disabled") {
    lastHealth = { driver, status: "disabled", migrationsApplied: [] };
    return lastHealth;
  }
  if (driver === "postgres") {
    try {
      if (!postgresPool) {
        postgresPool = new pg.Pool({ connectionString: resolvePostgresUrl() });
      }
      return await bootstrapPostgresAsync();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastHealth = {
        driver: "postgres",
        status: "error",
        migrationsApplied: [],
        message,
      };
      return lastHealth;
    }
  }
  return bootstrapDatabase();
}

export function getDatabaseHealth(): DatabaseHealth {
  return lastHealth;
}

export function getSqliteDatabase(): DatabaseSync | null {
  return sqliteDb;
}

export function getPostgresPool(): pg.Pool | null {
  return postgresPool;
}

export async function closeDatabase(): Promise<void> {
  if (sqliteDb) {
    try {
      sqliteDb.close();
    } catch {
      /* ignore close races on Windows */
    }
    sqliteDb = null;
  }
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
  }
}

export { CORE_TABLES, runPostgresMigrations, runSqliteMigrations };
