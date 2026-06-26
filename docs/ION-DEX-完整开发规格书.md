================================================================================
ION DEX 完整开发规格书 — 纯文字版
Generated: 2026-06-20
Project: D:\openclaw-tools\ion-dex-nuke
================================================================================

==============================
一、项目概述
==============================

ION DEX 是基于 ION 链（Ice Open Network）和 BSC 双链的去中心化交易所。
终极目标是：DEX → AI量化 → 电商 → 外卖/打车 → 保险 → 物流 → 全球支付 → ION Identity。
当前 Phase 1：DEX 核心（Swap/Pool/Stake/Bridge）。

技术栈：(FunC, ./contracts/ion/)  ION链合约
(Solidity, ./contracts/bsc/)  BSC链合约
(React+TypeScript+Vite, ./frontend/)  前端
(Foundry, ./contracts/lib/forge-std/)  合约测试框架
(OpenZeppelin, ./contracts/lib/openzeppelin-contracts/)  标准库
(FunC Blueprint)  ION链编译测试框架

==============================
二、核心合约 — BSC (Solidity)
==============================

1. DexSwap.sol — DEX核心交易
   Swap: swapExactTokensForTokens / swapTokensForExactTokens
   费率: 0.3% (写死不可改)
   路由: IonSwapRouter.sol + PancakeSwap V3 集成
   限价: minimumOutputAmount 参数防滑点

2. LiquidityPool.sol — 流动性池
   功能: addLiquidity / removeLiquidity / getReserves
   池费: 0.1% LP手续费
   集成: PancakeSwap V3 position manager

3. LiquidityMine.sol — 流动性挖矿
   功能: stake LP tokens / claimRewards / emergencyWithdraw
   奖励: ION token 按区块释放
   地址: BSC_LIQUIDITY_MINE_ADDRESS (已配置)

4. StakeReward.sol — 质押奖励
   产品: 灵活8% / 7天10% / 30天12% / 90天15% / 180天20% / 365天30%
   功能: stake / unstake / claimRewards / getPoolInfo

5. Burn.sol — 手续费销毁
   机制: 动态浮动销毁 (USDT/USDC锚定, 熊市多烧牛市少烧)
   黑洞: 0x000000000000000000000000000000000000dEaD
   公示: burnRecord / totalBurned / lastBurnBlock

6. DynamicBurnConfig.sol — 销毁参数动态调整
   根据 ION/USDT 价格动态调整销毁比例

7. FeeReceiver.sol + FeeReceiverAdmin.sol — 收费分发
   收入分配: Master 25% → 0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c
              销毁 X% (动态)
              质押奖励池 20%
              国库 10%

8. IonSwapRouter.sol — PancakeSwap V3 路由
   封装 PancakeSwap V3 的 exactInput/exactOutput

9. IonWrapper.sol — ION/WBNB 包裹
   包装/解包 ION token

10. BSCVault.sol — 金库
    多签: 3/5 签名 + 48小时时间锁
    功能: deposit / withdraw / transferOwnership

11. IonOracle.sol — 预言机
    双源: Chainlink + PancakeSwap TWAP
    用途: 销毁比例计算 / 保险触发条件

12. TokenIssuer.sol — Token发行
    费用: 100 ION (50%销毁)
    功能: deployToken / configurePool

13. BridgeRelay.sol — 跨链桥 (BSC侧)
    ION链 ←→ BSC 双向桥接

14. NFTAuction.sol — NFT拍卖
    用途: 物流提单NFT / 域名NFT

15. BatchTransfer.sol — 批量转账

16. OrderBook.sol — 限价单簿

17. VaultLock.sol — 时间锁金库

18. Dividend.sol — 分红合约

19. AdminManager.sol — 管理权限

20. IonProtocolFeeLib.sol — 手续费计算库

==============================
三、核心合约 — ION链 (FunC)
==============================

1. pool.fc — 流动性池 (AMM)
   功能: add_liquidity / remove_liquidity / swap
   机制: constant product AMM (x*y=k)

2. router.fc — 路由器
   功能: route_swap / multi_hop
   桥接: ION链内多池路由

3. vault.fc — 金库
   功能: deposit / withdraw / lock

4. lp_account.fc + lp_wallet.fc — LP管理
   功能: stake / unstake / claim / emergency_withdraw

5. staking-pool.fc — 质押池
   功能: stake / unstake / claim_rewards / get_pool_data

6. BridgeInbox.fc — 跨链桥 (ION侧)
   接收 BSC 跨链消息

7. FeeDistributor.fc — 费用分发 (ION侧)
   对应 BSC FeeReceiver

8. sandwich.fc — MEV防护
   三明治攻击检测和防护

9. dns-registrar.fc / dns-resolver.fc / dns-auction.fc — DNS服务
   ION链域名系统 (ION Identity 基础设施)

10. deployer.fc — 部署器

11. common.fc / gas.fc — ION链工具库

12. 多链互通合约 (FunC, contracts/ 根):
    ion_cross_border_payment_v6.fc — 跨境支付
    ion_ecommerce_escrow_v6.fc — 电商担保
    ion_mmr_ledger_v6.fc — Merkle Mountain Range 账本
    ion_multichain_gateway_v6.fc — 多链网关

==============================
四、前端页面 — React + TypeScript + Vite
==============================

1. SwapPage.tsx — 核心交易
   输入: tokenA / tokenB / amountIn / amountOutMin / deadline
   输出: swap结果 / txHash / gas费用
   数据源: DexSwap.sol + IonSwapRouter.sol + PancakeSwap V3

2. PoolPage.tsx — 流动性管理
   功能: 添加/移除流动性 / 查看池子状态
   数据: getReserves / totalSupply / LP余额 / APR

3. StakePage.tsx — 质押
   功能: 质押/解押 / 选择锁定期 / 查看收益
   数据: StakeReward.sol / APY实时计算

4. BridgePage.tsx — 跨链桥
   功能: ION ↔ BSC 双向桥接 / 查看桥接状态
   合约: BridgeRelay.sol + BridgeInbox.fc

5. DashboardPage.tsx — 仪表盘
   功能: 资产总览 / 收益概览 / 最近交易 / 销毁统计

6. AiMarketPage.tsx — AI 交易市场
   功能: AI 策略列表 / 信号展示 / TradingAgents 集成入口

7. TradeProPage.tsx — 专业交易
   功能: K线图 / 深度图 / 限价单 / OrderBook

8. CopyTradePage.tsx — AI 跟单
   功能: 选择交易员 / 跟单参数 / 风险限额

9. AiSubscriptionPage.tsx — AI 订阅管理
   费用: 10 ION/月 (50%销毁)

10. LiquidityMinePage.tsx — 流动性挖矿
    功能: 质押LP / 查看奖励 / 复投

11. VaultStakePage.tsx — 金库质押
    功能: 存入金库 / 查看TVL / 收益

12. SettingPage.tsx — 设置
    功能: 滑点 / Gas / 预言机 / 多签设置

13. DomainManagePage.tsx — 域名管理
    ION Identity 域名注册和管理

14. BatchTransferPage.tsx — 批量转账

15. BusinessPages.tsx — 商业服务入口
    电商 / 外卖 / 打车 / 保险 / 物流

16. ApproveManagerPage.tsx — 授权管理

==============================
五、UI 设计系统 — 精确数值
==============================

Color Palette (Deep Space + Neon Glow + Glassmorphism):
  背景黑:         #000000
  面板背景:       rgba(20, 25, 45, 0.4)
  玻璃效果:       rgba(20, 25, 45, 0.4)
  面板边框:       rgba(255, 255, 255, 0.15)
  霓虹青:         #00ffff
  霓虹洋红:       #ff00ff
  霓虹紫:         #8d4dff
  正面/买入绿:    #00ff88
  负面/卖出红:    #ff4466
  警告黄:         #ffd166
  禁用文字:       rgba(255, 255, 255, 0.2)
  悬停背景:       rgba(255, 255, 255, 0.08)
  青色覆盖:       rgba(0, 255, 255, 0.15)
  青色边框:       rgba(0, 255, 255, 0.3)

Borders:
  发光青色:       1px solid #00ffff
  发光洋红:       1px solid #ff00ff
  发光紫色:       1px solid #8d4dff
  卡片边框:       1px solid rgba(255,255,255,0.08)

Typography:
  heading:        24px / font-weight 700 / line-height 1.3
  subheading:     18px / font-weight 600 / line-height 1.4
  body:           14px / font-weight 400 / line-height 1.5
  caption:        12px / font-weight 400 / line-height 1.5
  dataValue:      20px / font-weight 700 / font-family 'JetBrains Mono'
  dataLabel:      12px / font-weight 500 / letter-spacing 0.05em
  poolTitle:      14px / font-weight 600 / letter-spacing 0.05em
  poolStat:       28px / font-weight 700 / font-family 'JetBrains Mono'
  poolLabel:      11px / font-weight 500 / letter-spacing 0.08em / uppercase
  buttonLabel:    13px / font-weight 600 / letter-spacing 0.1em / uppercase
  badgeLabel:     10px / font-weight 600 / letter-spacing 0.12em / uppercase

Spacing:
  栅格间距:       20px
  卡片内边距:     24px
  圆角:           28px
  页面边距:       40px
  段落间距:       32px
  元素间距:       12px
  大图标:         64px
  小图标:         32px
  按钮圆角:       12px
  输入框圆角:     8px

布局:
  三列栅格:       350px | 1fr | 300px  (DEXGridHarness 强制)
  禁止:           fixed/absolute 定位
  图标:           <img> 加载 /public/assets/icons/, 禁止CSS绘制

==============================
六、工程铁律 (.cursorrules)
==============================

0. 编译前运行:   make audit
   提交前运行:   npm run validate
   推送前运行:   scripts/verify-100.ps1 -Iterations 100

1. 零 Mock:      所有后端接口对接真实链上数据
                 所有合约调用使用真实ABI+有效地址
                 禁止 mock/placeholder/TODO假数据

2. 代码简即是美:  组件文件 ≤300行, 工具函数 ≤200行

3. 精确数值:     禁止形容词 ("流光溢彩" → "#00ffff glow 12px blur")
                 颜色hex/rgba, 尺寸px, 字体名+字号+字重+行高+字间距
                 动画: 缓动函数名+起始终止值+duration+delay

4. 写入即验证:   写后立即读回检查, 不准凭印象说"写入了"
                 关键信息必须冗余存储

5. 三不:         不拍马屁 / 不说废话 / 不绕弯子

6. Design Tokens: 所有CSS必须引用 src/lib/design-tokens.ts
                  禁止在组件CSS中直接写hex/rgba值

7. Layout:        所有页面包裹 DEXGridHarness
                  禁止 fixed/absolute 定位

8. Contract:      所有合约操作通过 agent_harness.py --audit
                  写入前安全审计: eval/exec/system/os检查
                  FunC编译通过 + Blueprint测试通过

9. 安全:          10类攻击每类100次全绿 → 1000次底线
                  重入/闪电贷/三明治/预言机操控/权限绕过/整数溢出/
                  拒绝服务/假币攻击/时间戳操控/抗量子攻击

==============================
七、验证门禁体系 (Pipeline Gates)
==============================

Commit Gate:
  1. backend tsc       — 无错误
  2. frontend tsc      — 无错误
  3. forge test        — 全部通过
  4. npm run validate  — token audit + contract audit PASS
  5. check-encoding    — 全部 UTF-8 无BOM / 无乱码

Push Gate:
  6. verify-100.ps1    — 100轮全绿 (1小时)
  7. commit trailer:   Verify-100-Proof: verify100-YYYYMMDDHHMMSS

CI/CD: .github/workflows/production.yml 自动触发

==============================
八、架构层次
==============================

三层防线:
  L1 Compile-time:  audit_tokens.py 拦截硬编码
  L2 Render-time:   Guarded component 检测DOM违规
  L3 Run-time:      合约测试套件拦截逻辑错误

三层架构:
  左边:  加密DEX (现货网格 + 套利 + 流动性挖矿)
  中间:  AI多智能体交易 (TradingAgents 79K⭐ )
  右边:  RWA资产上链结算 (ION链)

==============================
九、收入分配(铁律)
==============================

Master分成: 25% → 0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c (BSC)
销毁:        动态占比 (USDT/USDC锚定, 熊市多烧牛市少烧)
质押奖励池:  20%
国库:        10%

每笔收入先打Master地址, 再销毁/质押/国库。

各生态费率:
  DEX Swap:        0.3% 手续费
  Pool:            0.1% 手续费
  Token Launch:    100 ION → 50%销毁
  AI订阅:          10 ION/月 → 50%销毁
  跟单盈利抽成:    5%
  高级模型解锁:    5-10 ION → 50%销毁
  电商Escrow:      0.5%
  商家入驻:        50 ION/月 → 50%销毁
  外卖/打车:       0.5%
  骑手/司机质押:   100 ION
  保险/物流:       保费 / 0.3% 物流服务费
  提单NFT:         5 ION 铸造 → 50%销毁

==============================
十、当前进度状态 (2026-06-20)
==============================

✅ 已完成:
  - 16个前端页面全部真实实现
  - Swap/Pool/Stake/Bridge/Dashboard 5个核心页面完整
  - AI市场/跟单/订阅页面完成
  - 商业服务入口页面完成
  - 前端 tsc build 0 errors
  - 前端 Vitest 5 tests passed
  - Playwright 35 passed / 2 skipped
  - Backend 106 tests passed
  - Backend stress 9 endpoints passed
  - verify-100 100/100 GREEN
  - 编码检查 1474 files UTF-8 OK
  - 安全审计 0 vulnerabilities (high)

⏳ 进行中:
  - BridgePage JSX结构优化 (收口完成)
  - AppShell.tsx walletProviderLabel 闭合修复
  - Pipeline 前端脚本从 Next.js 迁移到 Vite

📋 待办:
  - P0: FunC 合约编译修复 + Forge build
  - P0: 100轮压力测试全覆盖
  - P1: 真实合约地址替换 (前端 config/contracts.ts)
  - P1: ION统一手续费合约层写死
  - P2: UI打磨 (霓虹光效+动画)
  - P2: 测试网部署+E2E

==============================
十一、技术依赖 (版本锁定)
==============================

BSC链:
  Solidity:     ^0.8.35
  Foundry:      1.7.1 (forge/cast/anvil)
  OpenZeppelin: latest (lib/openzeppelin-contracts)
  PancakeSwap:  V3 (IonSwapRouter 封装)

ION链:
  FunC:         编译器 (Blueprint)
  Blueprint:    0.12.0
  TON库:        @ton/ton 16.2.4 / @ton/core 0.63.1

前端:
  React:        Vite架构
  TypeScript:   严格模式
  Vitest:       单元测试
  Playwright:   E2E测试
  Design Tokens: src/lib/design-tokens.ts 单一真相源

代理:
  HTTP_PROXY:   http://127.0.0.1:7890
  HTTPS_PROXY:  http://127.0.0.1:7890

RPC:
  ION:          https://api.mainnet.ice.io/http/v2/
  BSC:          (通过Foundry配置)
  Explorer:     https://explorer.ice.io

==============================
十二、命令速查
==============================

编译:
  cd frontend && npm run build
  cd contracts && forge build

测试:
  cd frontend && npm test
  cd frontend && npm run verify
  cd contracts && forge test

审计:
  node scripts/audit-high.mjs
  cd frontend && npm run audit:high
  node scripts/frontend/audit-high.mjs
  npm run validate

验证:
  powershell -File scripts/verify-100.ps1
  powershell -File scripts/verify-100.ps1 -Iterations 100
  node scripts/verify-100-gate.mjs post-commit
  powershell -File scripts/check-encoding.ps1

Pipeline:
  powershell -File scripts/pipeline/pipeline.ps1 -Mode full
  powershell -File scripts/pipeline/pipeline-frontend.ps1 -Mode full

Dev:
  node scripts/dev-preflight.mjs
  npm start

==============================
十三、设计图元素 — 每页完整视觉规格
==============================

【全局视觉系统】
  主题: Deep Space + Neon Cyber + Glassmorphism
  背景色: #010104 (纯黑带微蓝底)
  全局底纹: CSS伪元素 body::before 双层网格线
    层1: 横线 repeat(180deg, 青色4%透明度, 间距48px)
    层2: 竖线 repeat(90deg, 紫色5%透明度, 间距80px)
    层3: 渐变叠加 linear-gradient 青色4%从上到下
    整体透明度: 0.35
  所有面板: backdrop-filter: blur(18px)
  所有面板背景: rgba(2,4,10,0.72) 玻璃态
  所有面板边框: 1px solid rgba(248,251,255,0.1)
  所有面板圆角: 20px
  极光渐变(CSS变量): linear-gradient(90deg, #00ffff, #6020ff, #ff00ff)

【页面0: 全局导航栏 TopNav】
  布局: flex row, justify-between, align-center
  高度: 64px
  背景: rgba(2,4,10,0.88) + backdrop-filter blur(18px)
  底部边框: 1px solid rgba(0,255,255,0.12)
  Logo区域:
    左侧圆形3D图标:  40px直径 [从/public/assets/icons/加载img标签]
    文字: "ION DEX" 字体18px字重700, 极光渐变填充文字
      实现: background: --ion-gradient-aurora; -webkit-background-clip: text; color: transparent
  中间导航链接:
    4个链接: Swap | Pool | Stake | Bridge
    激活态: 文字青色 #00ffff, 底部3px青色下划线 glow 0 0 12px
    非激活: rgba(248,251,255,0.5)
    间距: 每个链接之间32px
    字体: 14px字重500 letter-spacing 0.05em
  右侧:
    钱包按钮: 高36px 圆角12px, border 1px solid rgba(0,255,255,0.35)
    文字: 地址缩略 "0x1234...5678" 12px mono字体
    挂件: 青色圆点8px (已连接指示)
    下拉箭头: ▾ 青色

【页面1: SwapPage — 交换页面】
  布局: DEXGridHarness grid(350px 1fr 300px)
  左面板 (350px):
    标题: "Swap" 24px 字重700
    副标题: "Swap tokens instantly" 12px rgba(255,255,255,0.4) letter-spacing 0.08em

    Token 输入卡片 — Pay:
      背景: rgba(248,251,255,0.06) 圆角16px
      边框: 1px solid rgba(248,251,255,0.1), focus→1px solid #00ffff
      高度: 120px
      顶部标签: "You Pay" 11px 字重600 letter-spacing 0.08em rgba(255,255,255,0.35)
      数值输入框: 28px JetBrains Mono 字重700 #f8fbff, 右对齐
      placeholder: "0.0" rgba(255,255,255,0.2)
      Token选择按钮(右侧):
        背景: rgba(0,255,255,0.08) 圆角12px 高40px
        Token图标: 24px img
        Token名称: 14px 字重600
        下拉箭头: ▾ 12px 青色
      USD估值: 12px rgba(255,255,255,0.35) 显示在输入框下方
      余额显示: "Balance: X.XX" 12px rgba(255,255,255,0.35) 右对齐
      MAX按钮: 11px rgba(0,255,255,0.6) 字重600 点击填满余额

    中间交换箭头:
      ↓ 圆形按钮 40px
      背景: rgba(0,255,255,0.12) 边框 1px solid rgba(0,255,255,0.25)
      图标: ⇅ 20px 青色
      悬停: 旋转180deg transition 300ms ease-out
      点击: 交换tokenA和tokenB

    Token 输出卡片 — Receive:
      同上结构, 标签 "You Receive"
      输出值只读, 自动计算

    Gas费用行:
      标签: "Network Fee" 12px rgba(255,255,255,0.35)
      值: "~$0.XX" 12px 青色 mono字体

    交易路由行:
      标签: "Route" 12px rgba(255,255,255,0.35)
      值: "ION → WBNB → USDT" 12px rgba(255,255,255,0.5)

    兑换率行:
      标签: "Rate" 12px
      值: "1 ION = X.XX USDT" 12px rgba(255,255,255,0.5)

    滑点设置(可展开):
      默认: 0.5%
      可选: 0.1% / 0.5% / 1.0% / 自定义
      实现: 4个小按钮 圆角8px
      激活: 背景 rgba(0,255,255,0.12) 边框青色

    Swap按钮:
      全宽, 高56px, 圆角12px
      背景: --ion-gradient-aurora
      文字: "Swap" 16px 字重700 白色 letter-spacing 0.08em
      外发光: 0 0 24px rgba(0,255,255,0.35), 0 0 48px rgba(96,32,255,0.2)
      悬停: scale(1.02) brightness(1.1)
      按下: scale(0.98)
      禁用: opacity 0.5 cursor not-allowed (余额不足/未连接钱包)

  中间区域 (1fr):
    K线图 iframe:
      数据源: GeckoTerminal 嵌入图表
      高度: 100% 最小400px
      圆角: 20px 边框1px面板边框

  右面板 (300px):
    标题: "Market" 18px 字重600
    资产列表卡片:
      每个资产行: 高56px
      左侧: Token图标24px + 名称14px + 代码12px rgba(255,255,255,0.3)
      右侧: 价格 14px mono + 24h涨跌百分比
        涨: #00ff88 / 跌: #ff4466
      悬停背景: rgba(255,255,255,0.04)
      分隔线: 1px solid rgba(255,255,255,0.04)

    最近交易列表:
      标题: "Recent Trades" 14px 字重600
      每行: 时间12px mono + 类型(买/卖) + 数量 + 价格
      买: 青色标记 卖: 洋红标记

【页面2: PoolPage — 流动性池】
  布局: DEXGridHarness

  顶部Hero区:
    TVL大数字:
      数字: 48px JetBrains Mono 字重700 极光渐变
      背景: background-clip: text; color: transparent
      标签: "Total Value Locked" 11px letter-spacing 0.08em rgba(255,255,255,0.35)
    24h交易量:
      数字: 28px JetBrains Mono
    24h手续费:
      数字: 28px JetBrains Mono

  池子列表:
    表头: Pool | TVL | Volume 24h | APR | Action (12px rgba(255,255,255,0.35))
    每行动态:
      池名: Token图标对(叠放) + "ION/WBNB" 14px 字重600
      TVL: 14px mono
      Volume: 14px mono
      APR: 14px 字重700 青色
      Action按钮: "Add Liquidity" 高36px 边框青色 圆角12px
    悬停行背景: rgba(255,255,255,0.04)
    分隔线: 1px solid rgba(255,255,255,0.04)

  添加流动性弹窗(Modal):
    背景: rgba(2,4,10,0.95) + blur(18px) 圆角20px
    边框: 1px solid rgba(0,255,255,0.15)
    外发光: 0 0 40px rgba(0,255,255,0.16), 0 0 80px rgba(0,255,255,0.08)
    标题: "Add Liquidity" 24px 字重700
    两个Token输入框(同SwapPage)
    比例指示: "50% ION / 50% WBNB" 14px rgba(255,255,255,0.5)
    价格信息: "1 ION = X.XX WBNB" 12px
    LP份额预估: "You will receive X.XX LP tokens" 14px 青色
    确认按钮: 同Swap按钮

【页面3: StakePage — 质押页】
  布局: DEXGridHarness

  Hero区:
    总质押量: 48px JetBrains Mono 极光渐变
    质押APY范围: "8% 鈥?30%" 28px 字重700 青色

  质押产品卡片组 (6张):
    每张卡片:
      背景: rgba(2,4,10,0.72) 圆角20px 边框1px面板边框
      内边距: 24px
      锁定天数: 18px 字重600
      APY百分比: 36px JetBrains Mono 字重700 青色 glow(0 0 12px cyan)
      APY标签: 12px rgba(255,255,255,0.35)
      预计收益: "Est. APY: +XX ION/year" 14px 青色
      Stake按钮: 全宽, 高48px, 极光渐变, 圆角12px
      悬停卡片: border变青色 rgba(0,255,255,0.35) glow增加
    6种产品:
      灵活: 8% APY (随时可取)
      7天: 10% APY
      30天: 12% APY
      90天: 15% APY
      180天: 20% APY
      365天: 30% APY

  用户质押状态:
    已质押数量: 28px mono
    待领取奖励: 28px mono 青色
    到期时间: 14px
    Claim按钮: 极光渐变 高48px

  质押历史表:
    表头: Date | Amount | Duration | Status | Reward
    每行: 14px字体
    Status: Active=青色 / Completed=绿色 / Emergency=红色

【页面4: BridgePage — 跨链桥】
  布局: DEXGridHarness

  标题: "ION Bridge" 24px 字重700

  桥接卡片:
    背景: rgba(2,4,10,0.72) 圆角20px
    内边距: 32px
    最大宽度: 480px 居中

    源链选择:
      下拉: 标签 "From" 11px letter-spacing 0.08em
      选项: BSC | ION | Ethereum | Greenfield
      选中显示: 链图标24px + 链名16px

    目标链选择:
      同上结构, 标签 "To"
      中间箭头: ↓ 40px圆形按钮 同SwapPage

    Token数量输入:
      同SwapPage输入框

    桥接费用:
      显示: "Bridge Fee: X.XX ION" 12px rgba(255,255,255,0.35)
      预计到达: "ETA: ~2-5 minutes" 12px 青色

    Bridge按钮:
      同Swap按钮样式

  交易历史:
    表头: Time | From | To | Amount | Status | TxHash
    Status: Pending=黄色 / Success=绿色 / Failed=红色
    每行可点击展开详情

【页面5: DashboardPage — 仪表盘】
  布局: DEXGridHarness

  Hero区 (全宽):
    总资产价值:
      大数字: 56px JetBrains Mono 字重700 极光渐变
      二级数字: "≈ $X,XXX.XX USD" 18px rgba(255,255,255,0.4)
    24h变化:
      百分比 + 箭头 ↑/↓
      涨: #00ff88 ↑ / 跌: #ff4466 ↓

  资产概览卡片组(3列, auto-fit minmax 280px):
    每张卡片:
      图标: 24px img
      名称: 14px 字重600
      余额: 20px mono 字重700
      USD价值: 14px rgba(255,255,255,0.35)
    3张卡片: Wallet Balance | Staked | LP Tokens

  收益概览:
    环形饼图(Canvas绘制):
      数据: Swap收益 / 质押收益 / LP收益
      颜色: 青色 / 紫色 / 洋红
    旁边: 各收益数字和百分比

  最近交易:
    表: 时间 | 类型 | 数量 | 状态
    类型图标: Swap(⇅) / Stake(🔒) / Bridge(🌉)

  销毁统计:
    今日销毁: 28px mono 红色#ff4466
    累计销毁: 20px mono
    燃烧进度条: 宽100% 高8px 圆角4px
      背景: rgba(255,255,255,0.06)
      填充: --ion-gradient-aurora
      标签: "XX% burned" 12px

  资产分布饼图:
    4个扇区: ION / wION / LP / Other
    不同颜色, 带图例

【页面6: AI交易页面群】
  AiMarketPage:
    策略卡片列表:
      每张卡片: 策略名 / 收益率 / 风险等级 / 订阅按钮
      风险: 低=绿色 / 中=黄色 / 高=红色

  CopyTradePage:
    交易员列表:
      头像(圆形48px) + 名字 + 收益率 + 跟单人数
      跟单按钮: 极光渐变
    参数设置:
      跟单金额 / 最大滑点 / 止损比例
      数值输入框 同SwapPage

  AiSubscriptionPage:
    订阅套餐卡片:
      免费版 / 专业版(10 ION/月) / 企业版(100 ION/月)
      激活套餐: 边框青色 glow
      订阅按钮: 极光渐变

【页面7: DashboardPage 右侧边栏(TradePro展开)】
  TradeProPage:
    全屏K线图:
      TradingView 嵌入 iframe
      工具栏: 时间周期(1m/5m/15m/1h/4h/1D/1W)
        激活按钮: 背景青色rgba 文字青色
    深度图:
      右侧叠加, 半透明
      买盘绿色 / 卖盘红色
    订单簿:
      买盘(上)绿色 卖盘(下)红色
      每行: 价格 mono + 数量 + 累计
      中间: 最新成交价 20px mono 青色
    下单面板:
      Limit / Market tab切换
      数量输入 + 价格输入
      Buy按钮: 绿色#00ff88 glow / Sell按钮: 红色#ff4466 glow

【全局交互动画规范】
  所有hover: transition 300ms cubic-bezier(0.16,1,0.3,1)
  按钮hover: scale(1.02) brightness(1.1) glow增强
  按钮active: scale(0.98)
  卡片hover: border-color变青色rgba(0,255,255,0.35) + glow增强
  输入框focus: border-color变#00ffff + glow 0 0 12px rgba(0,255,255,0.3)
  页面切换: fadeIn 300ms (opacity 0→1)
  弹窗出现: scale(0.95→1) + fadeIn 300ms cubic-bezier(0.34,1.56,0.64,1) [弹性]
  Token交换箭头: 点击时rotate(180deg) transition 300ms
  数字跳动: 无动画 (直接更新,避免误导)
  Loading态: 骨架屏 shimmer效果 (rgba(255,255,255,0.04)来回移动)

【响应式断点】
  >=1280px: 三列 grid(350px 1fr 300px)
  1024~1279px: 两列 stack
  768~1023px: 单列, 圆角降为12px, 字号降1级
  <768px: 单列, 面板全宽, 内边距16px

【图标系统】
  所有图标: /public/assets/icons/ 目录 img标签加载
  禁止: CSS绘制图标 (background/svg-inline/border-trick)
  图标清单:
    3D ION logo (40px)
    Token图标: ion.png / wbnb.png / usdt.png / link.png (24px/32px)
    操作图标: swap.svg / pool.svg / stake.svg / bridge.svg (24px)
    状态图标: success.svg / pending.svg / failed.svg (16px)
  所有图标都需要 @2x 版本 (Retina)

