import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { CORE_TABLES, bootstrapDatabase, closeDatabase, getDatabaseHealth } from "../src/db/index.js";

describe("ION DEX database layer", () => {
  before(async () => {
    await closeDatabase();
    process.env.ION_DB_PATH = ":memory:";
    process.env.ION_DB_AUTO_MIGRATE = "1";
    delete process.env.DATABASE_URL;
    delete process.env.ION_DB_DISABLED;
  });

  after(async () => {
    await closeDatabase();
    delete process.env.ION_DB_PATH;
  });

  it("applies sqlite migrations and creates core tables", () => {
    const health = bootstrapDatabase();
    assert.equal(health.status, "ok");
    assert.equal(health.driver, "sqlite");
    assert.ok(health.migrationsApplied.includes("001_core_schema"));
    assert.equal(health.tableCount, CORE_TABLES.length);
    const cached = getDatabaseHealth();
    assert.equal(cached.tableCount, CORE_TABLES.length);
  });

  it("is idempotent on second bootstrap", () => {
    const health = bootstrapDatabase();
    assert.equal(health.status, "ok");
    assert.deepEqual(health.migrationsApplied, []);
  });
});
