# Cursor 任务：双轨并行 → TON Bounty 主攻

## 轨 A：ION DEX 继续
沿用之前的双轨指令继续跑：
1. 合约 P0 阶段 1-4（语法校验→安全审计→业务校验→模块化合并，每阶段100次验证）
2. 前端技术栈适配（豆包模板 → React/ION链）
3. 开发者手续费模块不可触碰（由 OpenClaw+豆包API 管控）

## 轨 B：TON Bounty 三单连打（当前优先，有钱优先）

全部 PoC 完成后写入 `D:\openclaw-tools\bounty-pocs\` 目录。

---

### 单 1：【$2,500】TON Wallet Sanitizer & Spam Burner
- **来源**：TON Footsteps #1231
- **链接**：https://github.com/ton-society/grants-and-bounties/issues/1231
- **技术栈**：FunC + TG Mini App + TON Connect + Vue3/TS
- **功能**：扫描 TON 钱包，检测 spam/phishing NFT 和 dust tokens，批量销毁/清理
- **参考**：Sol Incinerator (sol-incinerator.com)
- **产出要求**：
  - TG Mini App（Telegram Mini App）
  - TON Connect 钱包连接
  - 扫描+展示垃圾资产列表
  - 批量烧毁/发送到死地址
  - PoC 包括一个快速可运行的 TG Bot 或 Web App
- **目标**：提交完整 PoC 到 GitHub + TON Footsteps issue 评论

---

### 单 2：【$1,000】TonConnect + better-auth Web Dashboard
- **来源**：TON Footsteps #1228
- ****（#1228 具体功能需读取 issue 详情）**
- **目标**：完成 Web Dashboard 并提交 PoC

---

### 单 3：【$3,400】Telegram Gifts Unified Python SDK
- **来源**：TON Footsteps #1229
- **链接**：https://github.com/ton-society/grants-and-bounties/issues/1229
- **技术栈**：Python 3.9+ asyncio, aiohttp/httpx, aiogram 3.x
- **功能**：统一 Tonnel × Portals × Fragment 三个 TG Gifts 市场的 Python SDK
- **参考**：fastlane-sdk (Python)，gifts-sdk (JS)
- **产出要求**：
  - Python SDK 包（pip 可安装）
  - 三方市场统一 API
  - 价格抓取+订单管理+礼物管理
  - 完整文档+测试

---

## 执行顺序
1. 单 1（Spam Burner）→ 单 2（Auth Dashboard）→ 单 3（Gifts SDK）
2. 每个产出提交 GitHub 后再进下一个
3. ION DEX 轨 A 继续后台跑，不受 bounty 影响
