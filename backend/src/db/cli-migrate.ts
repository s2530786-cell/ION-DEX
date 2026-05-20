import { bootstrapDatabase, bootstrapDatabaseAsync, closeDatabase, getDatabaseHealth } from "./index.js";

async function main(): Promise<void> {
  const driver = process.env.ION_DB_DRIVER?.trim().toLowerCase() ?? (process.env.DATABASE_URL ? "postgres" : "sqlite");
  if (driver === "postgres" || process.env.DATABASE_URL) {
    await bootstrapDatabaseAsync();
  } else {
    bootstrapDatabase();
  }
  const health = getDatabaseHealth();
  if (health.status === "error") {
    console.error(`[db:migrate] FAILED: ${health.message ?? "unknown error"}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `[db:migrate] driver=${health.driver} status=${health.status} applied=${health.migrationsApplied.join(",") || "none"} tables=${health.tableCount ?? 0}`,
  );
  await closeDatabase();
}

main().catch((error: unknown) => {
  console.error("[db:migrate] FAILED:", error);
  process.exitCode = 1;
});
