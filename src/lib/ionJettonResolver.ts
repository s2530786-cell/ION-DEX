/**
 * ionJettonResolver — 查询 ION 原生链上的 Jetton Wallet 地址
 *
 * 为什么需要：ION/TON 系 swap 是「用户把代币转给 Router 的 jetton wallet」，
 * 而 Jetton transfer 必须发给「用户自己在该代币上的 jetton wallet」，
 * 由它内部 internal_transfer 给目标。所以发交易前必须先推导出：
 *   1. 用户在「卖出代币」上的 jetton wallet（= tx.to）
 *   2. Router 在「卖出代币」上的 jetton wallet（= swap 转账目的地）
 *   3. Router 在「买入代币」上的 jetton wallet（= swapPayload.otherTokenWallet）
 *
 * 两条推导路径（实测 2026-06-26，ION 主网 https://api.mainnet.ice.io）：
 *   ① 主路径 Indexer v3 /indexer/v3/jetton/wallets?owner_address=&jetton_address=
 *      —— 稳定返回 {address(raw), owner, jetton}；适用「钱包已部署」（持币者/活跃 Router）。
 *   ② Fallback runGetMethod get_wallet_address —— 适用「钱包尚未部署」边缘情况。
 *      ⚠️ 实测该公共节点对 get_wallet_address 偶发/持续 503（get-method 模拟器加载
 *         合约代码崩溃；seqno 等简单方法正常）。故仅作兜底，不作主路径。
 *
 * 全部只读（不上链、不花钱、不签名）。
 */

import { Address, beginCell, Cell } from '@ton/core';

export const ION_MAINNET_HTTP_V2 = 'https://api.mainnet.ice.io/http/v2';
export const ION_MAINNET_INDEXER_V3 = 'https://api.mainnet.ice.io/indexer/v3';

// ─────────────────────────────────────────────────────────────
// 主路径：Indexer v3
// ─────────────────────────────────────────────────────────────

interface IndexerWalletsResp {
  jetton_wallets?: Array<{
    address: string;   // raw 0:HEX
    owner: string;     // raw
    jetton: string;    // raw
    balance: string;
  }>;
}

/**
 * 用 indexer 查 owner 在某 jetton master 上的 jetton wallet 地址。
 * @returns friendly bounceable 地址；查不到返回 null（钱包未部署）。
 */
export async function getJettonWalletViaIndexer(
  jettonMasterAddress: string,
  ownerAddress: string,
  baseUrl: string = ION_MAINNET_INDEXER_V3
): Promise<string | null> {
  const url =
    `${baseUrl}/jetton/wallets?owner_address=${encodeURIComponent(ownerAddress)}` +
    `&jetton_address=${encodeURIComponent(jettonMasterAddress)}&limit=1`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`indexer jetton/wallets 失败: HTTP ${resp.status}`);
  }
  const json = (await resp.json()) as IndexerWalletsResp;
  const w = json.jetton_wallets?.[0];
  if (!w) return null;
  // indexer 返回 raw（0:HEX），归一化成 friendly bounceable
  return Address.parseRaw(w.address).toString();
}

// ─────────────────────────────────────────────────────────────
// Fallback：runGetMethod get_wallet_address
// ─────────────────────────────────────────────────────────────

interface RunGetResult {
  ok: boolean;
  result?: { stack: Array<[string, unknown]>; exit_code: number };
  error?: string;
  code?: number;
}

export async function runGetMethod(
  contractAddress: string,
  method: string,
  stack: Array<[string, unknown]>,
  baseUrl: string = ION_MAINNET_HTTP_V2
): Promise<NonNullable<RunGetResult['result']>> {
  const resp = await fetch(`${baseUrl}/runGetMethod`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: contractAddress, method, stack }),
  });
  const json = (await resp.json()) as RunGetResult;
  if (!json.ok || !json.result) {
    throw new Error(`runGetMethod(${method}) 失败: ${json.error ?? 'unknown'} (code ${json.code ?? resp.status})`);
  }
  if (json.result.exit_code !== 0) {
    throw new Error(`runGetMethod(${method}) exit_code=${json.result.exit_code}`);
  }
  return json.result;
}

/** owner 地址 → runGetMethod slice 入参（beginCell().storeAddress().endCell()）。 */
function addressToSliceParam(owner: string): [string, string] {
  const cell = beginCell().storeAddress(Address.parse(owner)).endCell();
  return ['slice', cell.toBoc().toString('base64')];
}

/** 从 runGetMethod stack 读 Address（["cell"|"slice", {bytes:bocB64}]）。 */
function readAddressFromStack(stack: Array<[string, unknown]>): Address {
  if (!stack.length) throw new Error('get_wallet_address 返回空 stack');
  const [, value] = stack[0];
  let bocB64: string | undefined;
  if (typeof value === 'object' && value !== null && 'bytes' in value) {
    bocB64 = (value as { bytes: string }).bytes;
  } else if (typeof value === 'string') {
    bocB64 = value;
  }
  if (!bocB64) throw new Error(`无法解析 get_wallet_address 返回: ${JSON.stringify(stack[0])}`);
  return Cell.fromBoc(Buffer.from(bocB64, 'base64'))[0].beginParse().loadAddress();
}

/** Fallback：调 jetton master 的 get_wallet_address（钱包未部署时算地址）。 */
export async function getJettonWalletViaGetMethod(
  jettonMasterAddress: string,
  ownerAddress: string,
  baseUrl: string = ION_MAINNET_HTTP_V2
): Promise<string> {
  const result = await runGetMethod(
    jettonMasterAddress,
    'get_wallet_address',
    [addressToSliceParam(ownerAddress)],
    baseUrl
  );
  return readAddressFromStack(result.stack).toString();
}

// ─────────────────────────────────────────────────────────────
// 统一入口：先 indexer，未命中再 fallback get-method
// ─────────────────────────────────────────────────────────────

/**
 * 查询 owner 在某 Jetton Master 上的 jetton wallet 地址（friendly bounceable）。
 * 先走 indexer（稳定，适用已部署钱包）；查不到再用 get_wallet_address 兜底。
 */
export async function getJettonWalletAddress(
  jettonMasterAddress: string,
  ownerAddress: string
): Promise<string> {
  const viaIndexer = await getJettonWalletViaIndexer(jettonMasterAddress, ownerAddress).catch(() => null);
  if (viaIndexer) return viaIndexer;
  // 钱包未部署或 indexer 无记录 → 用 get-method 计算地址
  return getJettonWalletViaGetMethod(jettonMasterAddress, ownerAddress);
}
