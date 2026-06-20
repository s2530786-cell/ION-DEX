# 升级阀门规则 (Gate Rules)

## 四级阀门系统

```
P0 VALVE ──→ P1 VALVE ──→ P2 VALVE ──→ RELEASE VALVE
 (11+4)       (7)          (4)          (final)
```

---

## P0 阀门：内部开发就绪

### 检查角色 (11)
| # | 角色 | 检查项 |
|---|------|--------|
| 1 | PM | 所有 P0 任务已定义、优先级已排、backlog 已更新 |
| 2 | DD | Visual Constitution 已确认、Design Tokens 已锁定 v4.0+ |
| 3 | UCA | 所有组件 API 已定义、Props 类型完整 |
| 4 | CE | glassmorphism 主题实现完整、无硬编码样式 |
| 5 | LE | DEXGridHarness 覆盖所有页面、响应式断点验证 |
| 6 | AM | 所有 3D 图标在 /public/assets/icons/、webp 格式 |
| 7 | IE | 所有交互状态 (hover/active/focus/loading/error/empty) 实现 |
| 8 | RE | 375px/768px/1280px+ 全断点布局正确、无横向滚动 |
| 9 | PE | 首屏 < 3s、bundle < 200KB、图片 lazy loading |
| 10 | VQE | Playwright 截图 baseline 已建、pixelmatch diff < 2% |
| 11 | CG | .cursorrules 已加载、Zero-Visual-Discretion 已激活 |

### 系统条件 (4)
| # | 条件 | 标准 |
|---|------|------|
| S1 | TypeScript | `tsc --noEmit` 零错误 |
| S2 | Next.js Build | `next build` 成功、零警告 |
| S3 | Visual Diff | 5/5 页面 pixelmatch diff < 2% |
| S4 | Lint | ESLint 零错误、零警告 |

### 通过标准
- 11 角色全部 ✅
- 4 系统条件全部 ✅
- → P1 阀门解锁

---

## P1 阀门：外部集成就绪

### 检查角色 (7)
| # | 角色 | 检查项 |
|---|------|--------|
| 1 | i18n | zh/en 双语完整、无硬编码字符串、日期数字格式正确 |
| 2 | AE | ARIA label 完整、键盘导航可用、对比度 ≥ 4.5:1 |
| 3 | DTE | design-tokens.ts 为唯一真源、无其他文件定义颜色/间距/阴影 |
| 4 | GSE | DEXGridHarness.tsx grid-template-areas 正确、无 bypass |
| 5 | CO | 任务队列清晰、Cursor Composer 子 agent 就绪 |
| 6 | BE | Turbopack 配置正确、CI/CD pipeline 就绪 |
| 7 | CRE | 代码审查完成、P0 修复全部验证 |

### 通过标准
- 7 角色全部 ✅
- → P2 阀门解锁

---

## P2 阀门：生产部署就绪

### 验证角色 (4)
| # | 角色 | 检查项 |
|---|------|--------|
| 1 | VQE | 全页面 visual regression 通过 |
| 2 | PE | Lighthouse score ≥ 90 (Performance/Accessibility/BestPractices) |
| 3 | BE | 生产构建成功、静态资源 CDN 路径正确 |
| 4 | CRE | 最终代码审查、安全审查、无敏感信息泄露 |

### 通过标准
- 4 角色全部 ✅
- → Release 阀门解锁

---

## Release 阀门：最终发布

### 最终检查
| # | 检查项 |
|---|--------|
| 1 | 所有 P0/P1/P2 阀门已绿灯 |
| 2 | 生产环境变量 .env.production 已配置 |
| 3 | 回滚方案已准备 |
| 4 | 监控/告警已配置 |
| 5 | CHANGELOG.md 已更新 |
| 6 | Git tag 已打 |

### 发布动作
1. CRE + CG 双 R3 签批
2. `git push origin main --tags`
3. `next build && next start` 生产模式
4. 冒烟测试 (5 页面 HTTP 200 + 核心交互)
5. 监控 30 分钟无异常 → 发布完成

---

## 阀门状态追踪

```
当前状态: P0 VALVE
  11 角色: 0/11
  4 系统: 0/4
  状态: 🔴 未开启

P1 VALVE: 🔒
P2 VALVE: 🔒
RELEASE: 🔒
```

## 缰绳规则
- 任何阀门未全绿，禁止跳过
- 阀门升级需 CO + CRE 双签
- 阀门降级 (回退) 需全团队通知 + Master 批准
- 紧急 hotfix 可绕过 P1/P2 直接到 Release，但必须在 1 小时内补全 P1/P2 检查
