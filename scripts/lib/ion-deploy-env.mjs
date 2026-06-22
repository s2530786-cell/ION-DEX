/**
 * Shared deploy env parsing for live preflight / broadcast scripts.
 */

export const REQUIRED_DEPLOY_ENVS = [
  "ION_DEPLOY_OWNER_ADDRESS",
  "ION_DEPLOY_LP_RECIPIENT",
  "ION_DEPLOY_TREASURY_RECIPIENT",
  "ION_DEPLOY_INSURANCE_RECIPIENT",
  "ION_DEPLOY_TOKEN0_ADDRESS",
  "ION_DEPLOY_TOKEN1_ADDRESS",
];

export const OPTIONAL_DEPLOY_ENVS = [
  "ION_DEPLOY_FEE_DISTRIBUTOR_ADDRESS",
  "ION_DEPLOY_ROUTER_ADDRESS",
  "ION_DEPLOY_VAULT_ADDRESS",
  "ION_DEPLOY_STAKING_POOL_ADDRESS",
  "ION_DEPLOY_SANDWICH_GUARD_ADDRESS",
  "ION_DEPLOY_RPC_URL",
];

export function maskAddress(value) {
  if (value.length <= 16) {
    return value;
  }
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function assertAddress(name, value) {
  const trimmed = value.trim();
  if (trimmed.length < 48) {
    throw new Error(`${name} looks too short (${trimmed.length} chars)`);
  }
  if (trimmed.includes("<") || trimmed.includes(">")) {
    throw new Error(`${name} still contains placeholder syntax`);
  }
  if (/\s/.test(trimmed)) {
    throw new Error(`${name} must not contain whitespace`);
  }
  return trimmed;
}

export function resolveDeployNetwork() {
  const network = process.env.ION_DEPLOY_NETWORK ?? "testnet";
  if (network !== "testnet" && network !== "mainnet") {
    throw new Error(`ION_DEPLOY_NETWORK must be testnet or mainnet, got: ${network}`);
  }
  return network;
}

export function resolveDeployRpc(network) {
  return (
    process.env.ION_DEPLOY_RPC_URL?.trim() ||
    (network === "mainnet"
      ? "https://api.mainnet.ice.io/http/v2/jsonRPC"
      : "https://api.testnet.ice.io/http/v2/jsonRPC")
  );
}

export function loadDeployConfig() {
  const network = resolveDeployNetwork();
  return {
    network,
    rpc: resolveDeployRpc(network),
    owner: assertAddress("ION_DEPLOY_OWNER_ADDRESS", process.env.ION_DEPLOY_OWNER_ADDRESS ?? ""),
    lp: assertAddress("ION_DEPLOY_LP_RECIPIENT", process.env.ION_DEPLOY_LP_RECIPIENT ?? ""),
    treasury: assertAddress(
      "ION_DEPLOY_TREASURY_RECIPIENT",
      process.env.ION_DEPLOY_TREASURY_RECIPIENT ?? "",
    ),
    insurance: assertAddress(
      "ION_DEPLOY_INSURANCE_RECIPIENT",
      process.env.ION_DEPLOY_INSURANCE_RECIPIENT ?? "",
    ),
    token0: assertAddress("ION_DEPLOY_TOKEN0_ADDRESS", process.env.ION_DEPLOY_TOKEN0_ADDRESS ?? ""),
    token1: assertAddress("ION_DEPLOY_TOKEN1_ADDRESS", process.env.ION_DEPLOY_TOKEN1_ADDRESS ?? ""),
    feeDistributor:
      process.env.ION_DEPLOY_FEE_DISTRIBUTOR_ADDRESS?.trim() || "(deploy in step 1)",
    router: process.env.ION_DEPLOY_ROUTER_ADDRESS?.trim() || "(deploy in step 2)",
    vault: process.env.ION_DEPLOY_VAULT_ADDRESS?.trim() || "(deploy in step 3)",
    stakingPool: process.env.ION_DEPLOY_STAKING_POOL_ADDRESS?.trim() || "(deploy in step 4)",
    sandwichGuard: process.env.ION_DEPLOY_SANDWICH_GUARD_ADDRESS?.trim() || "(deploy optional)",
    lpBps: Number(process.env.ION_DEPLOY_LP_BPS ?? "5000"),
    treasuryBps: Number(process.env.ION_DEPLOY_TREASURY_BPS ?? "1000"),
    insuranceBps: Number(process.env.ION_DEPLOY_INSURANCE_BPS ?? "4000"),
    deployGrams: BigInt(process.env.ION_DEPLOY_DEPLOY_GRAMS ?? "500000000"),
    walletBase: process.env.ION_DEPLOY_WALLET_BASE?.trim() ?? "",
    walletSeqno: Number(process.env.ION_DEPLOY_WALLET_SEQNO ?? "0"),
    walletSubwallet: Number(process.env.ION_DEPLOY_WALLET_SUBWALLET ?? "0"),
  };
}

export function assertRequiredEnvs(keys = REQUIRED_DEPLOY_ENVS) {
  for (const key of keys) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing required env: ${key}`);
    }
  }
}

export function logMaskedConfig(config, { optionalKeys = OPTIONAL_DEPLOY_ENVS } = {}) {
  console.log("Resolved configuration (masked):");
  console.log(`  network=${config.network}`);
  console.log(`  rpc=${config.rpc}`);
  for (const [label, value] of [
    ["owner", config.owner],
    ["lp", config.lp],
    ["treasury", config.treasury],
    ["insurance", config.insurance],
    ["token0", config.token0],
    ["token1", config.token1],
  ]) {
    console.log(`  ${label}=${maskAddress(value)}`);
  }
  for (const key of optionalKeys) {
    const value = process.env[key]?.trim();
    console.log(value ? `  ${key}=${maskAddress(value)}` : `  ${key}=(unset)`);
  }
}
