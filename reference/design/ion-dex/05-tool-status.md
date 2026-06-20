# 前端开发团队 — 工具链状态

## 设计工具

| 工具 | 状态 | 用途 |
|------|------|------|
| design-dna | ✅ 已安装 | 设计稿 Token 提取 |
| design-extract | ⬜ 待接入 | Figma 设计稿结构导出 |
| lost-pixel | ⬜ 待接入 | 视觉回归测试云服务 |

## 开发工具

| 工具 | 状态 | 用途 |
|------|------|------|
| Next.js 16.2.9 | ✅ 运行中 | 前端框架 |
| Turbopack | ✅ 已配置 | 增量编译 |
| TypeScript 5.x | ✅ 通过 | 类型检查 |
| Tailwind CSS 4.x | ✅ 已配置 | 样式框架 |

## 测试工具

| 工具 | 状态 | 用途 |
|------|------|------|
| Playwright | ✅ 已配置 | 浏览器自动化截图 |
| pixelmatch | ✅ 已配置 | 像素级对比 |
| visual-diff.mjs | ✅ 已部署 | 批量截图对比脚本 |

## CI/CD

| 工具 | 状态 | 用途 |
|------|------|------|
| pipeline-frontend.ps1 | ❌ 未创建 | 前端 CI/CD 流水线 |
| Cursor Agent | ⚠️ API 配额耗尽 | 代码生成 |
| Git Hooks | ✅ 已配置 | 提交前检查 |

## 资产工具

| 工具 | 状态 | 用途 |
|------|------|------|
| ComfyUI | ✅ 已安装 | 3D 图标生成 |
| webp 转换 | ⬜ 待配置 | 图片格式优化 |
| IPFS 上传 | ✅ Pinata | 资产去中心化存储 |

## 阀门状态

| 阀门 | 状态 | 需要 |
|------|------|------|
| P0 | 🔴 未开启 | 11 角色 + 4 系统条件 |
| P1 | 🔒 锁定 | 7 角色 |
| P2 | 🔒 锁定 | 4 角色 |
| Release | 🔒 锁定 | 6 项检查 |

## 待办

1. 创建 `scripts/pipeline/pipeline-frontend.ps1`
2. 接入 design-extract（Figma 导出）
3. 接入 lost-pixel（云视觉回归）
4. 恢复 Cursor Agent 配额
5. 完成 src/pages/ 各页面路由
