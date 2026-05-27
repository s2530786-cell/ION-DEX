import { useCallback, useEffect, useMemo, useState } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { parseAddressLines, parseTransferCsv, type ParsedRecipientRow } from "@/lib/batchTransferCsv";
import {
  fetchBatchTransferConfig,
  validateBatchCollect,
  validateBatchTransfer,
  type ApiMeta,
  type BatchTransferConfig,
} from "@/lib/ionApi";

const ION_TOKEN_BSC = "0xe1ab61f7b093435204df32f5b3a405de55445ea8";

const fallbackConfig: BatchTransferConfig = {
  contractAddress: "0x0000000000000000000000000000000000000000",
  ionTokenAddress: ION_TOKEN_BSC,
  maxRecipients: 100,
  feeCurrency: "ION",
  contractDeployed: false,
  provenance: {
    source: "local-fallback",
    note: "Batch-transfer config API unavailable; showing placeholder limits.",
  },
};

const sampleCsv = `0x1111111111111111111111111111111111111111,1.25
0x2222222222222222222222222222222222222222,2.5`;

type TabMode = "transfer" | "collect";

function configToMeta(config: BatchTransferConfig, stale: boolean): ApiMeta {
  const source: ApiMeta["source"] =
    config.provenance.source === "local-session" ? "indexer" : "upstream";
  return {
    source,
    updatedAt: new Date().toISOString(),
    stale,
    requestId: "batch-transfer-ui",
  };
}

export function BatchTransferPage() {
  const [tab, setTab] = useState<TabMode>("transfer");
  const [config, setConfig] = useState<BatchTransferConfig>(fallbackConfig);
  const [meta, setMeta] = useState<ApiMeta>(configToMeta(fallbackConfig, true));
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("ready");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRecipientRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [tokenPreset, setTokenPreset] = useState<"native" | "ion" | "custom">("ion");
  const [customToken, setCustomToken] = useState("");

  const [mainAddress, setMainAddress] = useState("");
  const [collectText, setCollectText] = useState("");

  const tokenAddress = useMemo(() => {
    if (tokenPreset === "native") {
      return "native";
    }
    if (tokenPreset === "ion") {
      return ION_TOKEN_BSC;
    }
    return customToken.trim() || undefined;
  }, [customToken, tokenPreset]);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetchBatchTransferConfig();
      setConfig(response.data);
      setMeta(configToMeta(response.data, response.meta.stale));
      setLoadState("ready");
    } catch (error) {
      console.warn("[batch-transfer] config fetch failed; using fallback limits.");
      setConfig(fallbackConfig);
      setMeta(configToMeta(fallbackConfig, true));
      setLoadError(error instanceof Error ? error.message : String(error));
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyCsv = useCallback(() => {
    setLastResult(null);
    setActionError(null);
    if (tab === "transfer") {
      const parsed = parseTransferCsv(csvText);
      setRows(parsed.rows);
      setParseErrors(parsed.errors);
      return;
    }
    const parsed = parseAddressLines(collectText);
    setParseErrors(parsed.errors);
  }, [collectText, csvText, tab]);

  const transferValid = rows.length > 0 && parseErrors.length === 0;
  const collectAddresses = useMemo(() => parseAddressLines(collectText).addresses, [collectText]);
  const collectValid =
    /^0x[a-fA-F0-9]{40}$/.test(mainAddress.trim()) &&
    collectAddresses.length > 0 &&
    parseErrors.length === 0;

  async function submitValidation() {
    setBusy(true);
    setActionError(null);
    setLastResult(null);
    try {
      let summary = "";
      if (tab === "transfer") {
        const payloadText = rows.map((row) => `${row.address},${row.amount}`).join("\n");
        const response = await validateBatchTransfer(payloadText);
        summary = `Validated ${response.data.recipientCount} recipients, total ${response.data.totalAmount} ION. On-chain execution waits for BatchTransfer.sol deployment.`;
      } else {
        const payloadText = collectAddresses.join("\n");
        const response = await validateBatchCollect({ mainAddress: mainAddress.trim(), text: payloadText });
        summary = `Validated collect list with ${response.data.fromCount} source addresses targeting ${response.data.mainAddress.slice(0, 10)}….`;
      }
      setLastResult(summary);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
    setLastResult(null);
  }

  return (
    <div className="grid gap-5" data-testid="page-batch-transfer">
      <GlassPanel eyebrow="Treasury ops" testId="batch-transfer-hero" title="Batch transfer desk">
        <p className="text-sm text-slate-300/90">
          Transfer or collect up to {config.maxRecipients} addresses per batch. Payload validation runs
          through the gateway today; wallet signing and BatchTransfer.sol execution ship after contract
          deployment.
        </p>
        <div className="mt-3">
          <DataSourceBadge meta={meta} testId="batch-transfer-source" />
        </div>
      </GlassPanel>

      <div className="flex gap-2" data-testid="batch-transfer-tabs">
        <NeonButton
          className={tab === "transfer" ? "" : "opacity-70"}
          data-active={tab === "transfer" ? "true" : "false"}
          data-testid="batch-transfer-tab-transfer"
          type="button"
          onClick={() => setTab("transfer")}
        >
          Transfer
        </NeonButton>
        <NeonButton
          className={tab === "collect" ? "" : "opacity-70"}
          data-active={tab === "collect" ? "true" : "false"}
          data-testid="batch-transfer-tab-collect"
          type="button"
          onClick={() => setTab("collect")}
        >
          Collect
        </NeonButton>
      </div>

      <AsyncState error={loadError} onRetry={reload} state={loadState} testId="batch-transfer-config">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Max recipients"
            testId="batch-transfer-stat-max-recipients"
            value={String(config.maxRecipients)}
          />
          <MetricTile label="Fee currency" testId="batch-transfer-stat-fee" value={config.feeCurrency} />
          <MetricTile
            label="Contract"
            testId="batch-transfer-stat-contract"
            value={config.contractDeployed ? "Deployed" : "Pending"}
          />
          <MetricTile
            label="Token preset"
            testId="batch-transfer-stat-token"
            value={tokenAddress === "native" ? "BNB" : tokenAddress === ION_TOKEN_BSC ? "ION" : "Custom"}
          />
        </div>
      </AsyncState>

      <GlassPanel testId="batch-transfer-form-panel" title={tab === "transfer" ? "Batch send" : "Batch collect"}>
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm text-slate-300">
            Token
            <select
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
              data-testid="batch-transfer-token-select"
              value={tokenPreset}
              onChange={(event) => setTokenPreset(event.target.value as typeof tokenPreset)}
            >
              <option value="native">BNB (native)</option>
              <option value="ion">ION (BSC)</option>
              <option value="custom">Custom ERC-20</option>
            </select>
          </label>
          {tokenPreset === "custom" ? (
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
              data-testid="batch-transfer-token-custom"
              aria-label="Custom token contract address"
              value={customToken}
              onChange={(event) => setCustomToken(event.target.value)}
            />
          ) : null}

          {tab === "transfer" ? (
            <>
              <label className="grid gap-1 text-sm text-slate-300">
                Recipients (address,amount per line)
                <textarea
                  className="min-h-[120px] rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs"
                  data-testid="batch-transfer-csv-input"
                  value={csvText}
                  onChange={(event) => setCsvText(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <NeonButton
                  className="!bg-white/10 !shadow-none"
                  data-testid="batch-transfer-paste-sample"
                  type="button"
                  onClick={() => setCsvText(sampleCsv)}
                >
                  Paste sample
                </NeonButton>
                <NeonButton
                  className="!bg-white/10 !shadow-none"
                  data-testid="batch-transfer-parse-btn"
                  type="button"
                  onClick={applyCsv}
                >
                  Parse list
                </NeonButton>
                <NeonButton
                  className="!bg-white/10 !shadow-none"
                  data-testid="batch-transfer-clear-btn"
                  type="button"
                  onClick={() => {
                    setCsvText("");
                    setRows([]);
                    setParseErrors([]);
                    setLastResult(null);
                  }}
                >
                  Clear
                </NeonButton>
              </div>
            </>
          ) : (
            <>
              <label className="grid gap-1 text-sm text-slate-300">
                Main wallet
                <input
                  className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs"
                  data-testid="batch-transfer-main-address"
                  aria-label="Main wallet address"
                  value={mainAddress}
                  onChange={(event) => setMainAddress(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                Source addresses (one per line)
                <textarea
                  className="min-h-[120px] rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs"
                  data-testid="batch-transfer-collect-input"
                  value={collectText}
                  onChange={(event) => setCollectText(event.target.value)}
                />
              </label>
              <NeonButton
                className="!bg-white/10 !shadow-none"
                data-testid="batch-transfer-parse-btn"
                type="button"
                onClick={applyCsv}
              >
                Validate addresses
              </NeonButton>
            </>
          )}

          {parseErrors.length > 0 ? (
            <ul className="text-sm text-rose-300" data-testid="batch-transfer-parse-errors">
              {parseErrors.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}

          {tab === "transfer" && rows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-white/10" data-testid="batch-transfer-recipient-table">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Address</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.address}-${index}`} data-testid={`batch-transfer-recipient-row-${index}`}>
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.address}</td>
                      <td className="px-3 py-2">{row.amount}</td>
                      <td className="px-3 py-2">
                        <NeonButton
                          className="!bg-white/10 !px-3 !py-1 !text-xs !shadow-none"
                          data-testid={`batch-transfer-remove-row-${index}`}
                          type="button"
                          onClick={() => removeRow(index)}
                        >
                          Remove
                        </NeonButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <NeonButton
            data-testid="batch-transfer-validate"
            disabled={busy || (tab === "transfer" ? !transferValid : !collectValid)}
            type="button"
            onClick={() => void submitValidation()}
          >
            {busy ? "Validating…" : tab === "transfer" ? "Validate batch send" : "Validate batch collect"}
          </NeonButton>

          {lastResult ? (
            <p className="text-sm text-emerald-200/90" data-testid="batch-transfer-result">
              {lastResult}
            </p>
          ) : null}

          {actionError ? (
            <p className="text-sm text-rose-300" data-testid="batch-transfer-action-error">
              {actionError}
            </p>
          ) : null}

          <p className="text-xs text-slate-400/90" data-testid="batch-transfer-note">
            {config.provenance.note}
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
