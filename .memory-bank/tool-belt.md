// ═══════════════════════════════════════════
// ION DEX — Installed Tool Belt
// Auto-loaded by Cursor on startup
// ═══════════════════════════════════════════

# 🛡️ Installed Security & Dev Tools

## Available Commands (Cursor can call these)

### Solidity (BSC contracts)
| Tool | Install | Command |
|------|---------|---------|
| **forge** | D:\openclaw-tools\foundry\bin\forge.exe | `forge build / forge test` |
| **solhint** | npm global (6.2.1) | `solhint "contracts/bsc/src/**/*.sol"` |
| **slither** | D:\openclaw-tools\venv\Scripts\slither.exe (0.11.5) | `slither . --solc forge` |
| **aider** | D:\openclaw-tools\venv\Scripts\aider.exe (0.86.2) | AI pair programmer (needs API key) |

### Auto-Execution Pipeline
| Script | Function |
|--------|----------|
| `node scripts/audit-all.mjs` | Full audit: forge→ test→ solhint→ slither→ tsc→ build |
| `node scripts/auto-watcher.mjs` | File watcher: auto-runs audit on .sol/.fc/.ts changes |
| `reports/audit-history.log` | Audit execution log |
| `reports/audit-errors.md` | Error report (only when failures) |

### Not Installed (Windows Incompatible)
| Tool | Reason |
|------|--------|
| Echidna (3.1K⭐) | Requires WSL/Docker, no native Windows binary |
| Mythril (3.7K⭐) | Requires C build deps (MSVC pyethash failure) |
| Aderyn (770⭐) | No Windows binary (macOS/Linux only) |
| 4naly3er (555⭐) | GitHub Action, not CLI-installable |

## Auto-Watcher Status
- **PID:** Auto-started on deploy
- **Logs:** reports/audit-history.log
- **Triggers:** Any .sol / .fc file change → auto audit in 3s
