/**
 * ionSwapBuilder — ION DEX swap 交易 BOC 构造器
 *
 * 职责：把一笔 swap 构造成 ION 钱包能签名的 base64 BOC，
 *       喂给 ionWalletService.sendIonTransaction。
 *
 * ⚠️ 格式来源：dex-core-v2 官方 wrappers（Router.ts / abcJettonWallet.ts），
 *    已在 @ton/sandbox 真实 FunC 合约环境跑通验证（System/ConstProduct 全绿，2026-06-26）。
 *    这里 1:1 复刻沙箱验证过的消息结构，零臆造。
 *
 * swap 真实姿势（TON/ION 系）：
 *   用户钱包 --(Jetton transfer 0xf8a7ea5)--> Router 的 jetton wallet
 *   forward_payload 里嵌 swapPayload(0x6664de2a)
 *   即：不是直接给 Router 发 swap op，而是转代币 + 附带 swap 指令。
 */

import { Address, beginCell, Cell } from '@ton/core';
import type { IonTxRequest } from './ionWalletService';
import { ionToNano } from './ionWalletService';

// ── 真实 opcode（dex-core-v2 wrappers，实测值）──────────────
export const ROUTER_OPCODES = {
  swap: 0x6664de2a,
  crossSwap: 0x69cf1a5b,
  provideLp: 0x37c096df,
  transferNotification: 0x7362d09c,
  payTo: 0x657b54f5,
} as const;

export const JETTON_OPCODES = {
  transfer: 0xf8a7ea5,        // 标准 Jetton transfer
  internalTransfer: 0x178d4519,
  burn: 0x595f07bc,
} as const;

// 随机 query_id（uint64）。复刻 wrapper 的 rndBigInt64()。
function rndQueryId(): bigint {
  const hi = BigInt(Math.floor(Math.random() * 0x100000000));
  const lo = BigInt(Math.floor(Math.random() * 0x100000000));
  return (hi << 32n) | lo;
}

export interface SwapParams {
  /** 卖出代币数量（最小单位，nano） */
  jettonAmount: bigint;
  /** Router 在「卖出代币」侧的 jetton wallet 地址（转账目的地） */
  routerJettonWallet: string;
  /** Router 在「买入代币」侧的 jetton wallet 地址（swapPayload.otherTokenWallet） */
  otherTokenWallet: string;
  /** 收款人（默认 = 用户自己） */
  receiver: string;
  /** 退款地址（默认 = 用户自己） */
  refundAddress: string;
  /** 最小买入量（滑点保护），默认 1n */
  minOut?: bigint;
  /** 截止时间（unix 秒） */
  deadline: number;
  /** 转发给 Router 的 gas（nano ION），驱动后续链上消息，默认 0.24 ION */
  fwdGas?: bigint;
  /** response/excess 接收地址（默认 = 用户自己） */
  responseAddress?: string;
  /** 推荐费 bps，max 100（1%），默认 10 */
  refFee?: number;
  /** 推荐人地址（可选） */
  refAddress?: string;
}

/**
 * 构造 swapPayload（forward_payload，对应 Router.ts swapPayload）。
 * 结构 1:1 复刻：
 *   swap(32) + otherTokenWallet + refundAddress + excessesAddress + deadline(64)
 *   + ref{ minOut(coins) + receiver + fwdGas(coins) + maybe(customPayload)
 *          + refundFwdGas(coins) + maybe(refundPayload) + refFee(16) + refAddress }
 */
export function buildSwapPayload(p: SwapParams): Cell {
  const receiver = Address.parse(p.receiver);
  const refund = Address.parse(p.refundAddress);
  const excesses = p.responseAddress ? Address.parse(p.responseAddress) : refund;
  const other = Address.parse(p.otherTokenWallet);
  const refAddr = p.refAddress ? Address.parse(p.refAddress) : null;

  const inner = beginCell()
    .storeCoins(p.minOut ?? 1n)
    .storeAddress(receiver)
    .storeCoins(p.fwdGas ?? 0n)
    .storeMaybeRef(null)            // customPayload
    .storeCoins(0n)                 // refundFwdGas
    .storeMaybeRef(null)            // refundPayload
    .storeUint(p.refFee ?? 10, 16)  // max 100 = 1%
    .storeAddress(refAddr)
    .endCell();

  return beginCell()
    .storeUint(ROUTER_OPCODES.swap, 32)
    .storeAddress(other)
    .storeAddress(refund)
    .storeAddress(excesses)
    .storeUint(p.deadline, 64)
    .storeRef(inner)
    .endCell();
}

/**
 * 构造最外层 Jetton transfer 消息体（对应 abcJettonWallet.sendTransfer）。
 * 用户钱包把代币转给 Router 的 jetton wallet，forward_payload 带 swapPayload。
 * 结构：transfer(32) + queryId(64) + amount(coins) + dest + responseDest
 *       + custom_payload(maybe=0) + fwd_ton_amount(coins) + fwd_payload(either: ref)
 */
export function buildSwapTransferBody(p: SwapParams): Cell {
  const dest = Address.parse(p.routerJettonWallet);
  const response = Address.parse(p.responseAddress ?? p.refundAddress);
  const fwdAmount = p.fwdGas ?? 0n;
  const swapPayload = buildSwapPayload(p);

  return beginCell()
    .storeUint(JETTON_OPCODES.transfer, 32)
    .storeUint(rndQueryId(), 64)
    .storeCoins(p.jettonAmount)
    .storeAddress(dest)
    .storeAddress(response)
    .storeBit(0)                  // custom_payload: null (Maybe 0)
    .storeCoins(fwdAmount)
    .storeBit(1)                  // forward_payload stored as ref (Either right)
    .storeRef(swapPayload)
    .endCell();
}

/** 转 base64 BOC。 */
export function bocToBase64(cell: Cell): string {
  return cell.toBoc().toString('base64');
}

/**
 * 一步到位：构造可直接喂给 sendIonTransaction 的 IonTxRequest。
 *
 * @param p          swap 参数
 * @param attachedTon 随消息附带的 ION（nano，付 gas + forward），
 *                    需 ≥ fwdGas + 链上各跳手续费。默认 0.3 ION。
 *
 * ⚠️ tx.to = 用户自己的「卖出代币」jetton wallet 地址（不是 Router！）。
 *    因为 Jetton transfer 是发给「自己的 jetton wallet」，由它内部转给 Router。
 *    调用方必须先查出用户在该代币上的 jetton wallet 地址。
 */
export function buildSwapTx(
  p: SwapParams,
  userJettonWallet: string,
  attachedTon: string = '0.3'
): IonTxRequest {
  const body = buildSwapTransferBody(p);
  return {
    to: userJettonWallet,
    value: ionToNano(attachedTon),
    data: bocToBase64(body),
    dataType: 'boc',
  };
}

// 默认转发 gas：0.24 ION（dex-core-v2 DEFAULT_MSG_VALUE 量级）
// 注意：fwdGas 是 nano 的 bigint（不是 ionToNano 的 string 返回值）
export const DEFAULT_FWD_GAS: bigint = BigInt(ionToNano('0.24'));
