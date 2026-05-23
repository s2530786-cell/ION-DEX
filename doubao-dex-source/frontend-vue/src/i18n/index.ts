import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: { swap: 'Swap', pool: 'Pool', stake: 'Stake', bridge: 'Bridge', orders: 'Orders' },
    swap: { from: 'From', to: 'To', swapNow: 'Swap Now', slippage: 'Slippage', fee: 'Fee' },
    pool: { add: 'Add Liquidity', remove: 'Remove', tvl: 'TVL', apr: 'APR' },
    stake: { stake: 'Stake', unstake: 'Unstake', claim: 'Claim', rewards: 'Rewards' },
    common: { connect: 'Connect Wallet', confirm: 'Confirm', cancel: 'Cancel' },
  },
  zh: {
    nav: { swap: '兑换', pool: '流动池', stake: '质押', bridge: '跨链桥', orders: '订单' },
    swap: { from: '从', to: '到', swapNow: '立即兑换', slippage: '滑点', fee: '手续费' },
    pool: { add: '添加流动性', remove: '移除', tvl: '总锁仓', apr: '年化' },
    stake: { stake: '质押', unstake: '解押', claim: '领取', rewards: '奖励' },
    common: { connect: '连接钱包', confirm: '确认', cancel: '取消' },
  },
}

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})
