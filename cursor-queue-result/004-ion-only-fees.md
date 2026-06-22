# 💰 P1-TASK-004: 统一 ION 手续费收费逻辑

## 优先级
🟧 P1 — 与 TASK-003 同级

## 背景
Master 2026-05-24 刚新增的铁律：
> **整个 DEX 的所有费用统一采用 ION 主链 `$ION` 收取，不做多币种手续费体系。**
> 覆盖销毁、质押、LP 等全部收费场景。

## 必须检查的文件清单

### 后端
1. `backend/src/config/contracts.ts` — 确认 fees.currency = 'ION'
2. `backend/src/services/quotes.ts` — 确认 price 返回 ION 价格
3. `backend/src/services/pool.ts` — LP 费用字段用 ION 计价
4. `backend/src/services/fees.ts` — (如存在) 去掉 USDT/BNB 费用逻辑

### 前端
1. `frontend/src/pages/trade/` — Swap 界面费用显示 ION
2. `frontend/src/pages/pool/` — Pool 界面 LP 收益显示 ION
3. `frontend/src/pages/staking/` — Staking 界面质押收益显示 ION
4. `frontend/src/components/FeeDisplay.tsx` — (如存在) 费用组件确认货币符号
5. `frontend/src/config/contracts.ts` — fees.currency = 'ION'

### 合约
1. `contracts/bsc/FeeReceiver.sol` — 检查 receiveFee 是否只接受 ION
2. `contracts/bsc/IonSwapRouter.sol` — Swap 手续费是否写死 ION
3. `contracts/bsc/StakeReward.sol` — 收益分配是否以 ION 计算

## 关键改动

### FeeReceiver.sol 核心逻辑
```solidity
// Master 钦定：所有只收 ION
// 不设 fallback/transfer 函数接受其他代币
function collectFee(address token, uint256 amount) external onlyRouter {
    require(token == ionToken, "FeeReceiver: only ION");
    // ... 收取逻辑
}

// 拒绝任何非 ION 转账
function onERC20Received(address, address, uint256, bytes calldata) external returns (bytes4) {
    // 只接受 ION 合约
    require(msg.sender == ionToken, "FeeReceiver: only ION");
    return this.onERC20Received.selector;
}
```

## 验收标准
- [ ] 后端 fees.currency 只输出 'ION'
- [ ] 前端任何费用显示（Swap fee / LP fee / Withdrawal fee）货币单位都是 ION
- [ ] FeeReceiver 合约 `collectFee` 需要 token 参数必须是 ION 地址，否则 revert
- [ ] 不存在 USDT/BNB 费用配置（删除或硬 disable）
- [ ] 测试：Frontend 页面截图确认费用显示 ION
- [ ] commit：`feat(fees): enforce ION-only fee policy across entire DEX`
