import type { ServerConfig } from "../config/server-config.js";
import { BSC_ION_TOKEN, ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { bscEthCall } from "./bsc-rpc.js";

const SELECTOR_GET_RESERVES = "0x0902f1ac";
const SELECTOR_TOKEN0 = "0x0dfe1681";
const SELECTOR_TOKEN1 = "0xd21220c7";

function decodeAddress(slotHex: string): string {
  return `0x${slotHex.slice(-40).toLowerCase()}`;
}

function decodeUint112(slotHex: string): bigint {
  return BigInt(`0x${slotHex.slice(0, 24)}`);
}

export type PancakePoolReserves = {
  poolAddress: string;
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  ionReserve: bigint;
  quoteReserve: bigint;
  ionIsToken0: boolean;
};

export async function fetchPancakeIonPoolReserves(
  config: ServerConfig,
  poolAddress: string = ION_BSC_LP_POOL,
): Promise<PancakePoolReserves> {
  const [reservesHex, token0Hex, token1Hex] = await Promise.all([
    bscEthCall(config, poolAddress, SELECTOR_GET_RESERVES),
    bscEthCall(config, poolAddress, SELECTOR_TOKEN0),
    bscEthCall(config, poolAddress, SELECTOR_TOKEN1),
  ]);

  const data = reservesHex.slice(2);
  const reserve0 = decodeUint112(data.slice(0, 64));
  const reserve1 = decodeUint112(data.slice(64, 128));
  const token0 = decodeAddress(token0Hex.slice(2));
  const token1 = decodeAddress(token1Hex.slice(2));
  const ionLower = BSC_ION_TOKEN.toLowerCase();

  let ionIsToken0 = token0 === ionLower;
  let ionReserve = ionIsToken0 ? reserve0 : reserve1;
  let quoteReserve = ionIsToken0 ? reserve1 : reserve0;

  if (token1 === ionLower) {
    ionIsToken0 = false;
    ionReserve = reserve1;
    quoteReserve = reserve0;
  } else if (token0 !== ionLower) {
    throw new Error("Pancake pool does not contain official ION token address.");
  }

  return {
    poolAddress: poolAddress.toLowerCase(),
    token0,
    token1,
    reserve0,
    reserve1,
    ionReserve,
    quoteReserve,
    ionIsToken0,
  };
}

export async function fetchPancakeIonPerBnb(config: ServerConfig): Promise<number> {
  const pool = await fetchPancakeIonPoolReserves(config);
  if (pool.quoteReserve <= 0n || pool.ionReserve <= 0n) {
    throw new Error("Pancake pool reserves are zero.");
  }
  return Number(pool.ionReserve) / Number(pool.quoteReserve);
}
