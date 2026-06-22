#!/usr/bin/env node
/**
 * Cursor subagentStart — inject same ION Skill route for Task subagents.
 * Uses subagent `task` text for keyword routing. UTF-8 without BOM.
 *
 * Note: Cursor docs only list permission/user_message for subagentStart;
 * additional_context is emitted best-effort. Reliable injection also uses
 * preToolUse + Task (ion-skill-route-task-pretool.mjs).
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolvePaths,
  readStdinSync,
  parseStdinJson,
  runSkillRoute,
  compactRoute,
  formatSubagentContext,
  fallbackContext,
  writeCache,
  readCachedRoute,
} from "./ion-skill-route-lib.mjs";

const hookDir = dirname(fileURLToPath(import.meta.url));
const { root, sessionCachePath, subagentCachePath } = resolvePaths(hookDir);

const subagentInput = parseStdinJson(readStdinSync());
const taskText = subagentInput.task ?? "";

let { route, error } = runSkillRoute(root, taskText);
if (!route) {
  const cached = readCachedRoute(sessionCachePath);
  if (cached?.skills) {
    route = cached;
    error = null;
  }
}

if (route) {
  writeCache(subagentCachePath, {
    hook: "subagentStart",
    generatedAt: new Date().toISOString(),
    subagent: {
      subagent_id: subagentInput.subagent_id,
      subagent_type: subagentInput.subagent_type,
      task: taskText,
    },
    route: compactRoute(route),
  });
}

const contextBody = route
  ? formatSubagentContext(route, subagentInput)
  : fallbackContext("subagentStart", error);

const output = {
  permission: "allow",
  additional_context: contextBody,
};

process.stdout.write(JSON.stringify(output));
