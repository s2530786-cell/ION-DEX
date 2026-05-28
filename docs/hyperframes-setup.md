# HyperFrames 本机安装（s2530786-cell/hyperframes）

仓库路径：`tools/hyperframes`（fork 自 [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)）

## 当前状态

| 步骤 | 状态 |
|------|------|
| Git 克隆 + LFS | 完成 |
| `bun install` | 完成 |
| `bun run build`（全部 packages） | 完成 |
| CLI `hyperframes` 全局 link | 完成（`hyperframes --version`） |
| Cursor Skills 联接 | 已链到 `.cursor/skills/`（与仓库内 `skills/` 同名目录） |

## 环境要求

- Node.js ≥ 22（本机 v22.22）
- FFmpeg（本机已安装）
- Bun（`npm install -g bun`）

## 常用命令

```powershell
$env:PATH = "$env:APPDATA\npm;$env:USERPROFILE\.bun\bin;" + $env:PATH
cd D:\openclaw-tools\ion-dex-nuke\tools\hyperframes

bun run studio          # 浏览器编辑器
hyperframes init my-video
hyperframes preview
hyperframes render
hyperframes add instagram-follow   # 从 registry 安装块
hyperframes doctor
```

## Cursor 集成

1. **插件（推荐）**：Cursor → Settings → Plugins → **Load unpacked** → 选择 `D:\openclaw-tools\ion-dex-nuke\tools\hyperframes`（含 `.cursor-plugin/plugin.json`）。
2. **Skills**：已通过目录联接安装到 `.cursor/skills/`（`hyperframes`、`hyperframes-cli`、`gsap`、`tailwind` 等）。在对话中使用 `/hyperframes` 或说明「用 hyperframes 做视频」。

## 可选能力（需额外密钥）

| 功能 | 说明 |
|------|------|
| TTS / 转写 / 抠图 | `hyperframes-media` skill；部分命令依赖 ONNX 模型（首次较慢） |
| 网站转视频 | `website-to-hyperframes` |
| AWS Lambda 渲染 | `packages/aws-lambda` 已构建 |
| Gemini 配图 | `.env` 中 `GEMINI_API_KEY`（见 `.env.example`） |

## 重新构建

```powershell
cd D:\openclaw-tools\ion-dex-nuke\tools\hyperframes
bun run build
```

日志可写入：`D:\Docker\ion-dex\logs\hyperframes-build-*.log`
