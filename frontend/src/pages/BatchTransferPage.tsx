import { useCallback, useEffect, useMemo, useState } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { useI18n } from "@/i18n/I18nProvider";
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
    note: "Batch-transfer config API unavailable; showing fallback limits.",
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
  const { isZh } = useI18n();
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
        summary = isZh
          ? `已校验 ${response.data.recipientCount} 个收款地址，总额 ${response.data.totalAmount} ION。链上执行仍等待 BatchTransfer.sol 部署。`
          : `Validated ${response.data.recipientCount} recipients, total ${response.data.totalAmount} ION. On-chain execution waits for BatchTransfer.sol deployment.`;
      } else {
        const payloadText = collectAddresses.join("\n");
        const response = await validateBatchCollect({ mainAddress: mainAddress.trim(), text: payloadText });
        summary = isZh
          ? `已校验归集列表，共 ${response.data.fromCount} 个来源地址，目标为 ${response.data.mainAddress.slice(0, 10)}...`
          : `Validated collect list with ${response.data.fromCount} source addresses targeting ${response.data.mainAddress.slice(0, 10)}...`;
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

  const provenanceNote =
    config.provenance.source === "local-fallback"
      ? isZh
        ? "批量转账配置接口当前不可用，页面展示的是回退限制。"
        : "Batch-transfer config API is currently unavailable, so the page is showing fallback limits."
      : config.provenance.note;

  return (
    <div className="grid gap-5" data-testid="page-batch-transfer">
      <GlassPanel
        eyebrow={isZh ? "资金操作" : "Treasury Ops"}
        testId="batch-transfer-hero"
        title={isZh ? "批量转账工作台" : "Batch Transfer Desk"}
      >
        <p className="text-sm text-slate-300/90">
          {isZh
            ? `单批最多可处理 ${config.maxRecipients} 个地址。当前支持通过网关做载荷校验；钱包签名与 BatchTransfer.sol 的真实执行会在合约部署后启用。`
            : `Transfer or collect up to ${config.maxRecipients} addresses per batch. Payload validation runs through the gateway today; wallet signing and BatchTransfer.sol execution ship after contract deployment.`}
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
          {isZh ? "批量发送" : "Transfer"}
        </NeonButton>
        <NeonButton
          className={tab === "collect" ? "" : "opacity-70"}
          data-active={tab === "collect" ? "true" : "false"}
          data-testid="batch-transfer-tab-collect"
          type="button"
          onClick={() => setTab("collect")}
        >
          {isZh ? "批量归集" : "Collect"}
        </NeonButton>
      </div>

      <AsyncState error={loadError} onRetry={reload} state={loadState} testId="batch-transfer-config">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label={isZh ? "最大地址数" : "Max Recipients"}
            testId="batch-transfer-stat-max-recipients"
            value={String(config.maxRecipients)}
          />
          <MetricTile
            label={isZh ? "手续费币种" : "Fee Currency"}
            testId="batch-transfer-stat-fee"
            value={config.feeCurrency}
          />
          <MetricTile
            label={isZh ? "合约状态" : "Contract"}
            testId="batch-transfer-stat-contract"
            value={config.contractDeployed ? (isZh ? "已部署" : "Deployed") : isZh ? "待部署" : "Pending"}
          />
          <MetricTile
            label={isZh ? "代币预设" : "Token Preset"}
            testId="batch-transfer-stat-token"
            value={
              tokenAddress === "native"
                ? "BNB"
                : tokenAddress === ION_TOKEN_BSC
                  ? "ION"
                  : isZh
                    ? "自定义"
                    : "Custom"
            }
          />
        </div>
      </AsyncState>

      <GlassPanel
        testId="batch-transfer-form-panel"
        title={tab === "transfer" ? (isZh ? "批量发送" : "Batch Send") : isZh ? "批量归集" : "Batch Collect"}
      >
        <div className="grid gap-4">
          <label className="grid gap-1 text-sm text-slate-300">
            {isZh ? "代币" : "Token"}
            <select
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
              data-testid="batch-transfer-token-select"
              value={tokenPreset}
              onChange={(event) => setTokenPreset(event.target.value as typeof tokenPreset)}
            >
              <option value="native">{isZh ? "BNB（原生）" : "BNB (native)"}</option>
              <option value="ion">{isZh ? "ION（BSC）" : "ION (BSC)"}</option>
              <option value="custom">{isZh ? "自定义 ERC-20" : "Custom ERC-20"}</option>
            </select>
          </label>
          {tokenPreset === "custom" ? (
            <input
              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
              data-testid="batch-transfer-token-custom"
              aria-label={isZh ? "自定义代币合约地址" : "Custom token contract address"}
              value={customToken}
              onChange={(event) => setCustomToken(event.target.value)}
            />
          ) : null}

          {tab === "transfer" ? (
            <>
              <label className="grid gap-1 text-sm text-slate-300">
                {isZh ? "收款列表（每行 address,amount）" : "Recipients (address,amount per line)"}
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
                  {isZh ? "填入示例" : "Paste Sample"}
                </NeonButton>
                <NeonButton
                  className="!bg-white/10 !shadow-none"
                  data-testid="batch-transfer-parse-btn"
                  type="button"
                  onClick={applyCsv}
                >
                  {isZh ? "解析列表" : "Parse List"}
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
                  {isZh ? "清空" : "Clear"}
                </NeonButton>
              </div>
            </>
          ) : (
            <>
              <label className="grid gap-1 text-sm text-slate-300">
                {isZh ? "主钱包地址" : "Main Wallet"}
                <input
                  className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 font-mono text-xs"
                  data-testid="batch-transfer-main-address"
                  aria-label={isZh ? "主钱包地址" : "Main wallet address"}
                  value={mainAddress}
                  onChange={(event) => setMainAddress(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                {isZh ? "来源地址（每行一个）" : "Source Addresses (one per line)"}
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
                {isZh ? "校验地址" : "Validate Addresses"}
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
                    <th className="px-3 py-2">{isZh ? "地址" : "Address"}</th>
                    <th className="px-3 py-2">{isZh ? "数量" : "Amount"}</th>
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
                          {isZh ? "移除" : "Remove"}
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
            {busy
              ? isZh
                ? "校验中…"
                : "Validating..."
              : tab === "transfer"
                ? isZh
                  ? "校验批量发送"
                  : "Validate Batch Send"
                : isZh
                  ? "校验批量归集"
                  : "Validate Batch Collect"}
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
            {provenanceNote}
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
