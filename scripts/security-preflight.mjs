import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".memory-bank/security-audit-and-stress-framework.md",
  "docs/23-security-audit-and-stress-sandbox.md",
  ".cursor/skills/ion-contract-audit/SKILL.md",
  ".cursor/skills/ion-data-backend/SKILL.md",
  ".memory-bank/implementation-playbook.md",
  ".memory-bank/live-data-reference.md",
  "docs/00-engineering-standards.md",
];

const markers = new Map([
  [".memory-bank/security-audit-and-stress-framework.md", ["Attack Defense Matrix", "Pressure And Chaos Sandbox", "Code Audit Procedure"]],
  ["docs/23-security-audit-and-stress-sandbox.md", ["Attack Defense Checklist", "Sandbox Plan", "Audit Output Template"]],
  [".cursor/skills/ion-contract-audit/SKILL.md", ["Required Security Checklist", "Testing Requirements"]],
  [".cursor/skills/ion-data-backend/SKILL.md", ["Reliability Rules", "Required Tests"]],
  [".memory-bank/implementation-playbook.md", ["Transaction Flow", "Wallet/Profile Integration Order"]],
  [".memory-bank/live-data-reference.md", ["Live Data Reference", "Hard Data Rules"]],
  ["docs/00-engineering-standards.md", ["智能合约验收标准", "压力测试"]],
]);

function readChecked(file) {
  const bytes = readFileSync(join(root, file));
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error(`${file} has a UTF-8 BOM`);
  }
  if (bytes.includes(0)) {
    throw new Error(`${file} contains NUL bytes`);
  }
  const text = bytes.toString("utf8");
  for (const marker of markers.get(file) ?? []) {
    if (!text.includes(marker)) {
      throw new Error(`${file} is missing marker: ${marker}`);
    }
  }
  return text;
}

console.log("=== ION DEX security preflight ===");
for (const file of requiredFiles) {
  readChecked(file);
  console.log(`READ_OK ${file}`);
}
console.log("");
console.log("OK - security preflight completed.");
