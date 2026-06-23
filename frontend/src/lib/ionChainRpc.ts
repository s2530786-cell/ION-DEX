const DEFAULT_ION_RPC =
  import.meta.env.VITE_ION_RPC_URL?.trim() || "https://api.mainnet.ice.io/http/v2/jsonRPC";

type IonRpcEnvelope<T> = {
  ok: boolean;
  result?: T;
  error?: string | { message?: string };
};

async function ionRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const response = await fetch(DEFAULT_ION_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`ION RPC HTTP ${response.status}`);
  }
  const data = (await response.json()) as IonRpcEnvelope<T>;
  if (!data.ok) {
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message || "ION RPC returned ok=false";
    throw new Error(message);
  }
  return data.result as T;
}

export async function fetchIonAddressBalanceNano(address: string): Promise<string> {
  const result = await ionRpc<string | number | bigint>("getAddressBalance", { address });
  return String(result);
}

export function formatIonBalanceFromNano(nanoAmount: string | number | bigint | null): string {
  if (nanoAmount === null || nanoAmount === undefined) {
    return "0";
  }
  const nano = BigInt(String(nanoAmount));
  const whole = nano / 1_000_000_000n;
  const fraction = nano % 1_000_000_000n;
  const fractionText = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return fractionText.length > 0 ? `${whole}.${fractionText}` : whole.toString();
}
