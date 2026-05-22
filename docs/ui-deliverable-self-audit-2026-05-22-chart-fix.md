# UI 交付自检 — Dashboard 图表 removeChild 修复（2026-05-22）

## 元信息

| 字段 | 内容 |
|------|------|
| 日期 | 2026-05-22 |
| 分支 | `cursor/ui-design-workflow-44c9` |
| 提交 | `bf1408b` |
| 问题 | `removeChild` 导致整页「ION DEX 渲染错误」 |
| 工程验证 | `bash scripts/ui-round-verify.sh` — **16/16 通过** |

## 结论摘要

**视觉门禁**：仍未宣称与 ref 像素级一致；**运行时崩溃已关闭**，Dashboard 可正常渲染 Swap + 蜡烛图 + 盘口。

## 根因与修复

| 项 | 说明 |
|----|------|
| 根因 | `MarketChart` 将 `ref` 挂在 lightweight-charts 改写的 DOM 上，React 卸载时与 `chart.remove()` 冲突 |
| 修复 | 内外层容器分离 + `safeRemoveChart()`；Dashboard 改用 `IonCandleChart` |
| 附带 | `App.tsx` `AnimatePresence initial={false}` |

## 用户侧自动验收清单

- [x] 远程 `bf1408b` 已推送
- [x] `ui-round-verify` 全绿
- [x] `current-*.png` 已从 preview `4173` 更新
- [ ] 用户本机：`git pull` + 重启 `dev:local` + Ctrl+Shift+R（云环境无法代操 Windows 进程）

## 本机命令（PowerShell）

```powershell
cd C:\路径\ION-DEX
git pull origin cursor/ui-design-workflow-44c9
git rev-parse --short HEAD
```

应输出 `bf1408b`。

```powershell
cd C:\路径\ION-DEX\backend
npm run start -- --port 8787
```

```powershell
cd C:\路径\ION-DEX\frontend
npm run dev:local
```

浏览器硬刷新后 Console 应无 `removeChild` 错误；`dashboard-swap-stage` 为 `true`。
