#!/usr/bin/env node
/**
 * Cursor sessionStart — inject ION Skill routing JSON.
 * UTF-8 without BOM.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolvePaths,
  readStdinSync,
  parseStdinJson,
  runSkillRoute,
  compactRoute,
  formatSessionContext,
  fallbackContext,
  writeCache,
} from "./ion-skill-route-lib.mjs";

const hookDir = dirname(fileURLToPath(import.meta.url));
const { root, sessionCachePath } = resolvePaths(hookDir);

const sessionInput = parseStdinJson(readStdinSync());
const { route, error } = runSkillRoute(root, "");

if (route) {
  writeCache(sessionCachePath, {
    hook: "sessionStart",
    generatedAt: new Date().toISOString(),
    session: sessionInput,
    route: compactRoute(route),
  });
}

const output = {
  env: {
    ION_SKILL_ROUTE: "1",
    ION_SKILL_ROUTE_CACHE: sessionCachePath,
  },
  additional_context: route
    ? formatSessionContext(route, sessionInput)
    : fallbackContext("sessionStart", error),
};

process.stdout.write(JSON.stringify(output));
