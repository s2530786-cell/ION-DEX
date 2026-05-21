/** Force test-mock before server modules load (verify-100 / CI). */
process.env.NODE_ENV = "test";
process.env.ION_DATA_MODE = "test-mock";
delete process.env.CMC_API_KEY;

await import("./stress.mjs");
