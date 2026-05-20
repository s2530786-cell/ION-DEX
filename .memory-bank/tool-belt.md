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

---

# 📦 2026-05-20 新增工具 (22 repos)

## 🌐 API 网关 (Go)

| 仓库 | ⭐ | 路径 | 用途 |
|------|-----|------|------|
| higress-group/higress | 8415 | repos/higress/ | AI Native API Gateway |
| luraproject/lura | 6775 | repos/lura/ | 超高性能 API 网关 |
| kgateway-dev/kgateway | 5519 | repos/kgateway/ | Cloud-Native API Gateway |

**安装:** `cd repos/<name> && go build ./...`
**用于 swap.ion:** higress 优先 (AI 路由 + 限流 + 安全)

## ⛓️ 区块链开发

| 仓库 | ⭐ | 路径 | 用途 |
|------|-----|------|------|
| ston-fi/ton-rs | 172 | repos/ton-rs/ | Rust TON: Cell/TLB/地址/钱包 |
| nessshon/tonutils | 154 | repos/tonutils/ | Python TON SDK (aiohttp+ton-core) |
| neodix42/MyLocalTon | 153 | repos/MyLocalTon/ | 本地 TON 测试网 (Java) |

**安装:** ton-rs: `cargo build` | tonutils: `pip install .` ✅ deps已装 | MyLocalTon: gradle
**注意:** ION ≠ TON, 仅作参考需适配

## 🤖 AI Agent 开发

| 仓库 | ⭐ | 路径 | 用途 |
|------|-----|------|------|
| vocodedev/vocode-core | 3748 | repos/vocode-core/ | 语音 LLM Agent 框架 |
| aiming-lab/SimpleMem | 3287 | repos/SimpleMem/ | LLM 终身记忆 (文本+多模态) |
| CherryHQ/cherry-studio | 45961 | repos/cherry-studio/ | AI 生产力工作室 (300+助手) |

**安装:** SimpleMem: `pip install -r requirements.txt` | cherry-studio: `npm install`

## 🎨 AI 图片/视频生成

| 仓库 | ⭐ | 路径 | 用途 |
|------|-----|------|------|
| Azornes/Comfyui-Resolution-Master | 263 | repos/Comfyui-Resolution-Master/ | 分辨率全控制 (ComfyUI 节点) |
| reneverland/CBIT-AiStudio | 253 | repos/CBIT-AiStudio/ | 企业级人像生成 |
| aredden/flux-fp8-api | 285 | repos/flux-fp8-api/ | Flux fp8 量化 2x 加速 |
| mitch7w/ai-video-editor | 53 | repos/ai-video-editor/ | LLM 视频粗剪 |

**用法:** flux-fp8-api 需 GPU, 本地仅参考 | ComfyUI 节点需 ComfyUI 环境

## 🎮 其他

| 仓库 | ⭐ | 路径 | 用途 |
|------|-----|------|------|
| djhaled/Uiana-MapImporter | 221 | repos/Uiana-MapImporter/ | UE 地图导入插件 |

## 📋 Cursor Agent 调用速查

```
开发 swap.ion 时:
  API 网关设计 → 参考 repos/higress 的 AI Gateway 模式
  ION 链 Python → 参考 repos/tonutils (需适配 ION 不兼容)
  ION 链 Rust   → 参考 repos/ton-rs (Cell/TLB 结构)
  Agent 记忆    → 参考 repos/SimpleMem 的终身记忆方案
  图片/素材生成 → 参考 repos/flux-fp8-api (需 GPU)
  语音交互      → 参考 repos/vocode-core
  本地测试网    → repos/MyLocalTon (Java, 需先 build)
```

---
*自动更新于 2026-05-20 09:09 CST | 旺财维护*
