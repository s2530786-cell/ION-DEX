# Tool-Belt Addendum — 2026-05-20 每日更新

以下 22 个新仓库已安装并可调用。按类别分组，标注依赖关系和用途。

---

## 🌐 API 网关 (Go)

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `higress-group/higress` | 8,415 | AI Native API Gateway，支持多模型路由、限流、安全 | go.mod, Go 1.21+ |
| `luraproject/lura` | 6,775 | 超高性能 API 网关，Linux Foundation 项目 | go.mod, Go 1.20+ |
| `kgateway-dev/kgateway` | 5,519 | Cloud-Native API Gateway + AI Gateway | go.mod, Go 1.22+ |

**用途:** swap.ion 后端 API 网关层。higress 优先（AI 原生 + 中文社区活跃）。

---

## ⛓️ 区块链开发

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `ston-fi/ton-rs` | 172 | Rust TON 库：Cell/TLB/地址/钱包/合约/tonlibjson 集成 | Cargo.toml, Rust 1.70+ |
| `nessshon/tonutils` | 154 | Python TON SDK：钱包、合约、ADNL/HTTP API | Python ≥3.10, aiohttp, ton-core |
| `neodix42/MyLocalTon` | 153 | 个人本地 TON 区块链（Java） | Java, Gradle |

**用途:** ION 链交互。ton-rs 用于 Rust 合约开发，tonutils 用于 Python 脚本/自动化。
**注意:** ION ≠ TON，ton-rs/tonutils 仅作参考，需适配 ION 链不兼容部分。

---

## 🤖 AI Agent 开发

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `vocodedev/vocode-core` | 3,748 | 语音 LLM Agent 框架，模块化+开源 | Python, requirements.txt |
| `aiming-lab/SimpleMem` | 3,287 | LLM 终身记忆系统：文本+多模态，高效检索 | Python, requirements.txt |
| `CherryHQ/cherry-studio` | 45,961 | AI 生产力工作室，300+ 助手，统一接入前沿 LLM | Node.js, package.json |

**用途:** SimpleMem 增强 Agent 长期记忆；vocode-core 语音交互；cherry-studio AI 工作台。

---

## 🎨 AI 图片生成

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `Azornes/Comfyui-Resolution-Master` | 263 | ComfyUI 分辨率/比例全控制，交互画布、SDXL/Flux/WAN 预设 | JavaScript, ComfyUI 节点 |
| `reneverland/CBIT-AiStudio` | 253 | 企业级 AI 人像生成平台，Flux 模型架构 | HTML, ComfyUI 后端 |
| `aredden/flux-fp8-api` | 285 | Flux fp8 量化推理 API，消费设备 2x 加速 | Python, requirements.txt |

**用途:** swap.ion 视觉素材生成。flux-fp8-api 快速出图，Comfyui-Resolution-Master 控制尺寸。

---

## 🎬 AI 视频制作

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `mitch7w/ai-video-editor` | 53 | LLM 驱动的视频粗剪拼接工具 | Python, requirements.txt |

---

## 🎮 虚幻引擎

| 仓库 | ⭐ | 用途 | 依赖 |
|------|-----|------|------|
| `djhaled/Uiana-MapImporter` | 221 | UE 插件，从游戏文件导入 Valorant 地图（网格/材质/光照） | C++, Unreal Engine |

---

## 🗂️ 其他 8 个

详见 `repos/daily-repos-log.md` 5月20日条目，包含 TON 教程、TON API SDK、作品集模板等。

---

## 🔧 安装状态

| 仓库 | 依赖类型 | 安装状态 |
|------|---------|---------|
| tonutils | pip (aiohttp, ton-core) | ✅ 已安装 |
| SimpleMem | pip (requirements.txt) | ⏳ 安装中 |
| flux-fp8-api | pip (requirements.txt) | ⏳ 安装中 |
| vocode-core | pip (requirements.txt) | ⏳ 安装中 |
| cherry-studio | npm (package.json) | ⏳ 安装中 |
| higress | Go | go.mod 已验证，按需 build |
| kgateway | Go | go.mod 已验证，按需 build |
| lura | Go | go.mod 已验证，按需 build |
| ton-rs | Cargo | Cargo.toml 已验证，按需 build |
| MyLocalTon | Java/Gradle | 已验证，按需 build |

---

## 📋 Cursor Agent 调用指南

开发 swap.ion 时：
1. **API 网关**: 参考 `higress` 的 AI Gateway 模式设计后端路由
2. **ION 链交互**: 参考 `ton-rs` Cell/TLB 结构，但必须适配 ION 不兼容部分
3. **Python 自动化**: 使用 `tonutils` 作为 ION 链脚本参考
4. **记忆增强**: `SimpleMem` 可用作 Agent 长期记忆方案
5. **图片生成**: 需要插图/素材时调用 `flux-fp8-api`
6. **语音**: 需要语音交互时参考 `vocode-core`

---
*自动生成于 2026-05-20 09:09，由旺财维护*
