# GitHub Daily — 机密目录在闭源仓

**禁止**把 `latest.json` / `latest.md` / `runs/` 提交到公开 `ion-dex-nuke`。

| 内容 | 位置 |
|------|------|
| 完整目录 | `d:/openclaw-tools/ion-private-core/.memory-bank/github-daily` |
| 私有 Skill | `ion-private-core/.cursor/skills/ion-github-daily-discovery/` |
| 发现 Skill 存根 | `github-discovered-*` 仅在 **ion-private-core** |
| 克隆区 | `d:/vendor-ion-discovery`（本地 gitignore） |

运行（在 ion-dex-nuke 根目录）：

```powershell
node scripts/github-daily-discovery.mjs
node scripts/github-daily-skill-stubs.mjs
```

仓库：https://github.com/s2530786-cell/ion-private-core
