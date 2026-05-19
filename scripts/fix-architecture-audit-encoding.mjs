#!/usr/bin/env node
/** One-off: fix em-dash/arrow spacing and mojibake in architecture-audit.md */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");
const filePath = path.join(root, ".memory-bank", "architecture-audit.md");
let s = fs.readFileSync(filePath, "utf8");

// Mojibake
s = s.replace(/\u8103/g, "\u00d7"); // 脳 -> ×
s = s.replace(/^## \?\? Official/m, "## Official");

// Em dash before letter (skip numeric ranges like 10–17 which use en-dash)
s = s.replace(/\u2014(?=[A-Za-z*])/g, "\u2014 ");

// Arrow glued to next word (keep P0→P1, 10/16→16/16)
s = s.replace(/\u2192(?=[a-z`])/g, "\u2192 ");
s = s.replace(/\u2192(?=[A-Z])/g, "\u2192 ");

// Table emoji spacing
s = s.replace(/\u2705(?=[A-Za-z0-9|])/g, "\u2705 ");
s = s.replace(/\u274c(?=[A-Za-z0-9|])/g, "\u274c ");

const legacy = `Legacy numbered list (same order):

  1. Fix 6 failing security tests — forge test all green
  2. ION FunC test framework — every .fc contract tested
  3. Backend database + real API — no more mock data
  4. BSC bridge contracts — BSCBridge.sol + BridgeVerifier.sol
  5. Relayer service — Node.js, monitor both chains
  6. PancakeSwap LP — create pair + seed liquidity
  7. Bridge UI — BusinessPages.tsx shell only (no BridgePage.tsx; real tx per docs/14)
  8. Full deploy scripts — one-command deploy all`;

s = s.replace(
  /Legacy numbered list \(same order\):[\s\S]*?PHASE NEXT \(P1\):/,
  `${legacy}\n\nPHASE NEXT (P1):`,
);

const p0block = `PHASE NOW (P0) — automation reads \`- [ ]\` below (first unchecked wins):

- [x] **P0-1** Fix 6 failing security tests — DONE 16/16; forge test --match-contract SecurityAttackTest all green (1500/1500)
- [x] **P0-2** ION FunC test framework — scripts/func-contract-test.mjs (compile-func 22/22 + golden regression)
- [x] **P0-3** Backend database layer — SQLite/Postgres schema + migrations
- [ ] **P0-4** Backend real data integration — replace mock services with RPC + CMC adapters
- [ ] **P0-5** Cross-chain bridge — BSC contracts + relayer + LP + Bridge UI shell
- [ ] **P0-6** Deployment scripts — Foundry (BSC) + FunC (ION) one-click deploy

`;

s = s.replace(/PHASE NOW \(P0\)[\s\S]*?Legacy numbered list/, `${p0block}Legacy numbered list`);

// P0–P3 gap bullets: use em dash not arrow
s = s.replace(/\*\*([^*]+)\*\* \u2192/g, "**$1** —");

// Collapse accidental double spaces (preserve newlines)
s = s.replace(/[^\S\n]{2,}/g, " ");

fs.writeFileSync(filePath, s, "utf8");
console.log("[OK] fixed", filePath);
