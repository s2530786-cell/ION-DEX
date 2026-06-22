# ION DEX Master Design References（设计图模板资产库）

> **唯一视觉标准**：本目录 + `.memory-bank/ui-design-master-template.md` + `.memory-bank/ui-cyber-glass-iron-law.md`  
> 前端 UI 开发必须对照此处 PNG/MP4，禁止凭记忆或泛化「赛博风」改稿。

## 目录结构

| 路径 | 内容 |
|------|------|
| `screens/` | Master 静态设计图（已重命名为可读文件名） |
| `boot/` | 开机动画母片（未压缩前可在此对比） |
| `brand/` | 品牌 Logo 母版 |

## 屏幕设计图索引

| 文件 | 用途 | 对照前端 |
|------|------|----------|
| `screens/01-glass-panel-wave-border.png` | 波浪霓虹流体玻璃边框 + 地面反射 | `.flow-border`、`.ion-glass-border`、弹窗外框 |
| `screens/02-mobile-feature-grid-dfi-dex.png` | 移动端五宫格 3D 玻璃砖 | 375px 底栏 / `FeatureTile` 质感 |
| `screens/03-dashboard-aurora-northern-lights.png` | Dashboard（极光+山峦背景） | `#/` `DashboardPage` 背景层 |
| `screens/04-dashboard-galaxy-spiral.png` | **Dashboard 主验收图**（银河+三栏+五钮） | `#/` `DashboardPage` 布局比例 |
| `screens/05-modal-pool-liquidity.png` | Pool 流动性池弹窗 | `#/pool` `PoolPage` |
| `screens/06-modal-bridge-crosschain.png` | Bridge 跨链桥弹窗 | `#/bridge` `BridgePage` |
| `screens/07-modal-burn-tracking.png` | Burn 销毁追踪面板 | `#/burn` `BurnPage` |
| `brand/ion-dex-brand-logo.png` | **ION DEX 品牌 Logo**（帽+星+字） | `SplashScreen`、开机动画、品牌字标 |

**默认 Dashboard 对比图**：`04-dashboard-galaxy-spiral.png`（1440px 宽并排）。  
**默认玻璃质感对比图**：`01-glass-panel-wave-border.png`。

## 开机动画母片

| 文件 | 原始来源 | 轮播映射 | 产出脚本 |
|------|----------|----------|----------|
| `boot/boot-master-square-landscape.mp4` | `Downloads/ION DEX 开机动画.mp4` | `boot-ion-cyber-*` | `scripts/process-boot-videos.ps1` |
| `boot/boot-master-portrait.mp4` | `Downloads/kaijidongION DEX.mp4` | `boot-ion-matrix-*` | 同上 |

运行编码（需 ffmpeg）：

```powershell
.\scripts\process-boot-videos.ps1 `
  -SourceSquare "D:\openclaw-tools\ion-dex-nuke\.memory-bank\design-refs\boot\boot-master-square-landscape.mp4" `
  -SourcePortrait "D:\openclaw-tools\ion-dex-nuke\.memory-bank\design-refs\boot\boot-master-portrait.mp4"
```

产物目录：`frontend/public/boot/`（`SplashScreen` + `bootVideoCarousel.ts` 读取）。

## 前端可引用 Logo

- 仓库内：`frontend/public/brand/ion-dex-logo-master.png`（与 `brand/ion-dex-brand-logo.png` 同源）

## Agent 必读顺序

1. `.memory-bank/ui-cyber-glass-iron-law.md`（色值/布局铁律）
2. **`.memory-bank/ui-design-master-template.md`**（对照流程 + 差距分析模板）
3. 本目录对应 PNG/MP4
4. `docs/cursor-prompt-ion-ui-1to1.md`（贴进 Cursor 对话）
