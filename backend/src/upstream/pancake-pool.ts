import type { ServerConfig } from "../config/server-config.js";
import { BSC_ION_TOKEN, ION_BSC_LP_POOL } from "../constants/official-ion-addresses.js";
import { bscEthCall } from "./bsc-rpc.js";

const SELECTOR_GET_RESERVES = "0x0902f1ac";
const SELECTOR_TOKEN0 = "0x0dfe1681";
const SELECTOR_TOKEN1 = "0xd21220c7";
const SELECTOR_SLOT0 = "0x3850c7bd";
const WBNB_BSC = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const Q96 = 2n ** 96n;

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

function sqrtPriceX96ToToken1PerToken0(sqrtPriceX96: bigint): number {
  const sqrt = Number(sqrtPriceX96) / Number(Q96);
  return sqrt * sqrt;
}

/** WBNB needed to buy 1 ION (from official LP). Supports Pancake V2 reserves or V3 slot0. */
export async function fetchPancakeIonWbnbPrice(
  config: ServerConfig,
  poolAddress: string = ION_BSC_LP_POOL,
): Promise<number> {
  try {
    const pool = await fetchPancakeIonPoolReserves(config, poolAddress);
    if (pool.ionReserve <= 0n || pool.quoteReserve <= 0n) {
      throw new Error("Pancake pool reserves are zero.");
    }
    return Number(pool.quoteReserve) / Number(pool.ionReserve);
  } catch {
    const [token0Hex, slot0Hex] = await Promise.all([
      bscEthCall(config, poolAddress, SELECTOR_TOKEN0),
      bscEthCall(config, poolAddress, SELECTOR_SLOT0),
    ]);
    const token0 = decodeAddress(token0Hex.slice(2));
    const sqrtPriceX96 = BigInt(`0x${slot0Hex.slice(2, 66)}`);
    const token1PerToken0 = sqrtPriceX96ToToken1PerToken0(sqrtPriceX96);
    const ionLower = BSC_ION_TOKEN.toLowerCase();
    const wbnbLower = WBNB_BSC.toLowerCase();

    if (token0 === wbnbLower) {
      return token1PerToken0;
    }
    if (token0 === ionLower) {
      return 1 / token1PerToken0;
    }
    throw new Error("Official Pancake pool token0 is neither WBNB nor ION.");
  }
}

/** ION token amount per 1 WBNB (V2 reserve ratio). V3 pools use {@link fetchPancakeIonWbnbPrice} for USD. */
export async function fetchPancakeIonPerBnb(config: ServerConfig): Promise<number> {
  const wbnbPerIon = await fetchPancakeIonWbnbPrice(config);
  if (wbnbPerIon <= 0) {
    throw new Error("Pancake ION/WBNB price is zero.");
  }
  return 1 / wbnbPerIon;
}
