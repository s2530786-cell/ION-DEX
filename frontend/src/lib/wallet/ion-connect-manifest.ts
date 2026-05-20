/** Shared TonConnect manifest URL for SDK and UI provider. */
export function ionConnectManifestUrl(): string {
  if (typeof window === "undefined") {
    return "https://ion.dex/ionconnect-manifest.json";
  }
  return `${window.location.origin}/ionconnect-manifest.json`;
}
