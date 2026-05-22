# 🧑‍💼 Dashboard 头像功能区域 + 卡片展开规格

**创建日期：2026-05-22**
**优先：P0 阻断**

## 1. Dashboard 顶部头像区（DashboardHeader）

### 位置
Dashboard 页面最顶部，手机 Tab 栏之上，桌面布局左列之上。

### 组件
```
┌────────────────────────────────────────────────────┐
│ [Avatar 48x48 可点击上传]  Welcome, IonHolder      │
│ 圆角胶囊,带霓虹发光    │ BSC: 0x8ff2...27b84c     │
│                         │ ION: UQCM...IRwJX8LiA    │
│                         │ [Connect Wallet] 按钮     │
│                         │ [折叠/展开 ▾]             │
├────────────────────────────────────────────────────┤
│ 功能卡片网格（Pool/Grid/Bridge/Burn/Domain/AI）      │
│ 点击 → **原位置展开** 不跳转                        │
│ 展开内容 = 对应页面的核心面板（SwapPanel/GridPanel...）│
│ 同一时间只展开一个                                    │
│ 展开动画: transition 300ms ease-out                  │
└────────────────────────────────────────────────────┘
```

### CSS 精确数值
| 参数 | 值 |
|------|-----|
| 头像圆角 | `border-radius: 24px` (48px size) |
| 头像发光 | `box-shadow: 0 0 20px rgba(36,247,255,0.35)` |
| 卡片容器 bg | `rgba(6, 16, 36, 0.55)` |
| 卡片 blur | `backdrop-filter: blur(12px)` |
| 卡片圆角 | `border-radius: 24px` |
| 卡片边框 | `1px solid rgba(36,247,255,0.12)` |
| 展开动画 | `transition: all 300ms cubic-bezier(0.4,0,0.2,1)` |

### 头像上传
- 使用 localStorage base64（已有 ProfileAvatar 逻辑）
- 点击头像 → 触发 file input
- 头像 URL 同时写入 `AvatarContext`

## 2. 卡片原地展开

### 行为
| 卡片 | 展开内容 |
|------|---------|
| Pool | PoolPage 内嵌版 |
| Grid | GridPage 内嵌版 |
| Bridge | BridgePage 内嵌版 |
| Burn | BurnPage 内嵌版 |
| ION ID | DomainPage 内嵌版 |
| AI Market | AIMarketPage 内嵌版 |

### 实现
```
state: expandedPanel: PageKey | null

点击卡片 →
  if expandedPanel === key → 收起 (set null)
  else → 展开 (set key)

展开区域用 AnimatePresence + motion.div
animate: { height: "auto", opacity: 1 }
exit: { height: 0, opacity: 0 }
transition: { duration: 0.3, ease: [0.4,0,0.2,1] }
```

## 3. DashboardHeader 状态

```
未连接钱包：
  [默认机器人头像] Connect wallet to begin

已连接：
  [用户头像或默认头像] EoaName or Wallet Address
  BSC: 0x... / ION: UQ...
  Balance: xx ION | xx BNB
```
