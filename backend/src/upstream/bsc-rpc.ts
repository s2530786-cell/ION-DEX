import type { ServerConfig } from "../config/server-config.js";
import {
  OFFICIAL_BSC_ION_BURN_ADDRESS,
} from "../constants/official-ion-addresses.js";
import { fetchJson } from "../lib/http.js";

type JsonRpcResponse<T> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
};

const DEAD_ADDRESS = OFFICIAL_BSC_ION_BURN_ADDRESS;

function encodeBalanceOfCall(holder: string): string {
  const normalized = holder.toLowerCase().replace("0x", "");
  return `0x70a08231000000000000000000000000${normalized.padStart(40, "0")}`;
}

async function rpcCall<T>(config: ServerConfig, method: string, params: unknown[]): Promise<T> {
  const payload = await fetchJson<JsonRpcResponse<T>>(config.bscRpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    },
    timeoutMs: config.httpTimeoutMs,
  });

  if (payload.error) {
    throw new Error(`BSC RPC ${method} failed: ${payload.error.message}`);
  }
  if (payload.result === undefined) {
    throw new Error(`BSC RPC ${method} returned empty result`);
  }
  return payload.result;
}

export type BscChainSnapshot = {
  chainId: number;
  blockNumber: number;
  rpcUrl: string;
};

export async function fetchBscChainSnapshot(config: ServerConfig): Promise<BscChainSnapshot> {
  const [chainIdHex, blockHex] = await Promise.all([
    rpcCall<string>(config, "eth_chainId", []),
    rpcCall<string>(config, "eth_blockNumber", []),
  ]);

  return {
    chainId: Number.parseInt(chainIdHex, 16),
    blockNumber: Number.parseInt(blockHex, 16),
    rpcUrl: config.bscRpcUrl,
  };
}

export async function fetchBscIonBurnedBalance(
  config: ServerConfig,
  tokenAddress: string,
): Promise<{ burnedWei: bigint; burnAddress: string; tokenAddress: string }> {
  const result = await rpcCall<string>(config, "eth_call", [
    {
      to: tokenAddress,
      data: encodeBalanceOfCall(DEAD_ADDRESS),
    },
    "latest",
  ]);

  return {
    burnedWei: BigInt(result),
    burnAddress: DEAD_ADDRESS,
    tokenAddress: tokenAddress.toLowerCase(),
  };
}

export async function fetchBscNativeBalance(
  config: ServerConfig,
  address: string,
): Promise<bigint> {
  const result = await rpcCall<string>(config, "eth_getBalance", [address, "latest"]);
  return BigInt(result);
}
