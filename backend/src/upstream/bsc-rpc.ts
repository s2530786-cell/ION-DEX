import type { ServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";

type JsonRpcResponse<T> = {
  jsonrpc: string;
  id: number;
  result?: T;
  error?: { code: number; message: string };
};

const DEAD_ADDRESS = "0x000000000000000000000000000000000000dead";

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

export async function bscEthCall(
  config: ServerConfig,
  to: string,
  data: string,
): Promise<string> {
  return rpcCall<string>(config, "eth_call", [{ to, data }, "latest"]);
}

export async function fetchBscAccountCode(
  config: ServerConfig,
  address: string,
): Promise<string> {
  return rpcCall<string>(config, "eth_getCode", [address, "latest"]);
}

export type EvmLeaderOnChainCheck = {
  ok: boolean;
  kind: "eoa" | "contract" | "unknown";
  note: string;
};

export async function verifyEvmLeaderOnChain(
  config: ServerConfig,
  address: string,
): Promise<EvmLeaderOnChainCheck> {
  try {
    const code = await fetchBscAccountCode(config, address);
    const normalized = code.trim().toLowerCase();
    if (normalized === "0x" || normalized === "0x0") {
      return { ok: true, kind: "eoa", note: "BSC eth_getCode reports EOA (no contract bytecode)." };
    }
    return {
      ok: false,
      kind: "contract",
      note: "Leader address has contract bytecode on BSC; copy-trade expects an EOA wallet.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, kind: "unknown", note: `BSC leader check failed: ${message}` };
  }
}
