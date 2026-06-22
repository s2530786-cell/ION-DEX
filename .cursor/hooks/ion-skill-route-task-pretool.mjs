#!/usr/bin/env node
/**
 * Cursor preToolUse (Task) — prepend compact skill route to subagent prompt.
 * Most reliable way to pass routing into isolated Task subagent context.
 * UTF-8 without BOM.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolvePaths,
  readStdinSync,
  parseStdinJson,
  runSkillRoute,
  formatCompactSubagentPrefix,
  fallbackContext,
} from "./ion-skill-route-lib.mjs";

const hookDir = dirname(fileURLToPath(import.meta.url));
const { root } = resolvePaths(hookDir);

const input = parseStdinJson(readStdinSync());

if (input.tool_name !== "Task") {
  process.stdout.write(JSON.stringify({ permission: "allow" }));
  process.exit(0);
}

const toolInput = input.tool_input && typeof input.tool_input === "object" ? { ...input.tool_input } : {};
const taskText = toolInput.prompt ?? toolInput.task ?? "";

const { route, error } = runSkillRoute(root, taskText);

if (!route) {
  process.stdout.write(
    JSON.stringify({
      permission: "allow",
      agent_message: fallbackContext("preToolUse Task", error),
    }),
  );
  process.exit(0);
}

const prefix = formatCompactSubagentPrefix(route);
const originalPrompt = String(toolInput.prompt ?? toolInput.task ?? "");
const mergedPrompt = originalPrompt.startsWith("[ION Skill Autopilot")
  ? originalPrompt
  : `${prefix}${originalPrompt}`;

const updatedInput = { ...toolInput };
if ("prompt" in toolInput) updatedInput.prompt = mergedPrompt;
else updatedInput.task = mergedPrompt;

process.stdout.write(
  JSON.stringify({
    permission: "allow",
    updated_input: updatedInput,
  }),
);
