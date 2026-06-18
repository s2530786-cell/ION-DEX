import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { useI18n } from "@/i18n/I18nProvider";
import {
  bindDomainManage,
  fetchDomainManageOverview,
  lookupDomainManage,
  registerDomainManage,
  renewDomainManage,
  transferDomainManage,
  type ApiMeta,
  type DomainManageOverview,
} from "@/lib/ionApi";

const ionDomainPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ion$/;

function isDomainLikeLabel(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 72 || !trimmed.includes(".")) {
    return false;
  }
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) {
    return false;
  }
  return ionDomainPattern.test(trimmed);
}

const fallbackOverview: DomainManageOverview = {
  ownedCount: 1,
  expiringSoon: 0,
  lastLookup: null,
  owned: [
    {
      name: "demo.ion",
      ownerAddress: "ion1demoowner000000000000000000000000000000000000",
      resolvedAddress: "ion1resolvedwallet000000000000000000000000000000",
      expiresAt: "2027-05-18T00:00:00.000Z",
      status: "active",
      bindTarget: "ion1resolvedwallet000000000000000000000000000000",
    },
  ],
  feeIon: {
    register: "2500.000",
    renew: "420.000",
    transfer: "120.000",
  },
  provenance: {
    source: "local-fallback",
    note: "Domain manage API unavailable; showing seed portfolio only.",
  },
};

function fallbackMeta(): ApiMeta {
  return {
    source: "mock",
    updatedAt: new Date().toISOString(),
    stale: true,
    requestId: "domain-manage-fallback",
  };
}

export function DomainManagePage() {
  const { isZh } = useI18n();
  const [overview, setOverview] = useState<DomainManageOverview>(fallbackOverview);
  const [meta, setMeta] = useState<ApiMeta>(fallbackMeta());
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("custodian.ion");
  const [selectedName, setSelectedName] = useState("demo.ion");
  const [bindWallet, setBindWallet] = useState("ion1resolvedwallet000000000000000000000000000000");
  const [transferTo, setTransferTo] = useState("ion1newowner0000000000000000000000000000000000");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validation = useMemo(() => {
    const labelValid = isDomainLikeLabel(query);
    return { labelValid, isValid: labelValid };
  }, [query]);

  const reload = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const response = await fetchDomainManageOverview();
      setOverview(response.data);
      setMeta(response.meta);
      if (response.data.owned.length > 0) {
        setSelectedName(response.data.owned[0]?.name ?? "demo.ion");
      }
      setLoadState("ready");
    } catch (error) {
      console.warn("[domain-manage] overview fetch failed; using fallback seed.");
      setOverview(fallbackOverview);
      setMeta(fallbackMeta());
      setLoadError(error instanceof Error ? error.message : String(error));
      setLoadState("ready");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const applyActionResult = useCallback((payload: DomainManageOverview & { message: string }) => {
    const { message: actionMessage, ...nextOverview } = payload;
    setOverview(nextOverview);
    setMessage(actionMessage);
    if (nextOverview.owned.length > 0 && !nextOverview.owned.some((entry) => entry.name === selectedName)) {
      setSelectedName(nextOverview.owned[0]?.name ?? selectedName);
    }
  }, [selectedName]);

  const runLookup = useCallback(async () => {
    if (!validation.isValid) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await lookupDomainManage(query.trim().toLowerCase());
      applyActionResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "域名查询失败，请稍后重试。" : "Domain lookup failed. Please try again later.");
    } finally {
      setBusy(false);
    }
  }, [applyActionResult, isZh, query, validation.isValid]);

  const runRegister = useCallback(async () => {
    if (!validation.isValid) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await registerDomainManage(query.trim().toLowerCase());
      applyActionResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "域名注册失败，请稍后重试。" : "Domain registration failed. Please try again later.");
    } finally {
      setBusy(false);
    }
  }, [applyActionResult, isZh, query, validation.isValid]);

  const runBind = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await bindDomainManage(selectedName, bindWallet.trim());
      applyActionResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "绑定失败，请稍后重试。" : "Binding failed. Please try again later.");
    } finally {
      setBusy(false);
    }
  }, [applyActionResult, bindWallet, isZh, selectedName]);

  const runTransfer = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await transferDomainManage(selectedName, transferTo.trim());
      applyActionResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "转移失败，请稍后重试。" : "Transfer failed. Please try again later.");
    } finally {
      setBusy(false);
    }
  }, [applyActionResult, isZh, selectedName, transferTo]);

  const runRenew = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await renewDomainManage(selectedName);
      applyActionResult(response.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : isZh ? "续费失败，请稍后重试。" : "Renewal failed. Please try again later.");
    } finally {
      setBusy(false);
    }
  }, [applyActionResult, isZh, selectedName]);

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runLookup();
  }

  return (
    <motion.div className="grid gap-5" data-testid="page-domain">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/70">ION DNS</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          {isZh ? "域名交易与绑定" : "Domain Trading and Binding"}
        </h1>
      </header>

      <GlassPanel eyebrow="ION DNS" testId="domain-manage-hero" title={isZh ? "域名管理" : "Domain Manage"}>
        <p className="text-sm text-white/70">
          {isZh
            ? "查询、注册并管理 .ion 域名：绑定钱包、转移所有权、续费。费用以 ION 计价；在链上 DNS 合约未接入前，页面只记录用户意图。"
            : "Look up, register, and manage .ion domains: bind wallets, transfer ownership, and renew names. Fees are priced in ION; until on-chain DNS contracts are wired, this page records user intent only."}
        </p>
        <DataSourceBadge meta={meta} testId="domain-metrics-source" />
      </GlassPanel>

      <motion.div
        className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-sm text-amber-100/90"
        data-testid="domain-manage-phishing-warn"
      >
        {isZh
          ? "请核对域名拼写和官方 ION DNS 解析来源，避免钓鱼标签与仿冒 .ion 注册页。"
          : "Double-check the label spelling and official ION DNS resolution source to avoid phishing labels or fake .ion registration pages."}
      </motion.div>

      <AsyncState error={loadError} onRetry={reload} state={loadState} testId="domain-manage-stats">
        <motion.div className="grid gap-4 sm:grid-cols-3">
          <MetricTile
            label={isZh ? "已拥有域名" : "Owned Domains"}
            testId="domain-manage-stat-owned"
            tone="cyan"
            value={String(overview.ownedCount)}
          />
          <MetricTile
            label={isZh ? "即将到期" : "Expiring Soon"}
            testId="domain-manage-stat-expiring"
            tone="gold"
            value={String(overview.expiringSoon)}
          />
          <MetricTile
            label={isZh ? "注册费用" : "Register Fee"}
            testId="domain-manage-stat-register-fee"
            tone="emerald"
            value={`${overview.feeIon.register} ION`}
          />
        </motion.div>
      </AsyncState>

      <GlassPanel testId="domain-manage-register" title={isZh ? "查询与注册" : "Lookup and Register"}>
        <form className="grid gap-4" data-testid="domain-form" onSubmit={submitLookup}>
          <label className="grid gap-2 text-sm text-white/70">
            {isZh ? "DNS / .ion 标签" : "DNS / .ion Label"}
            <input
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white"
              data-testid="domain-query"
              onChange={(event) => {
                setQuery(event.target.value);
                setMessage(null);
              }}
              placeholder="custodian.ion"
              value={query}
            />
          </label>

          {query.trim().length > 0 && !validation.labelValid ? (
            <p
              className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
              data-testid="domain-error"
            >
              {isZh
                ? "请输入有效的小写 .ion 域名，例如 custodian.ion。"
                : "Enter a valid lowercase .ion label, for example custodian.ion."}
            </p>
          ) : null}

          <motion.div
            className="rounded-2xl border border-indigo-300/25 bg-indigo-400/[0.07] p-4 text-sm text-indigo-100/80"
            data-testid="domain-preview"
          >
            {validation.isValid ? (
              <span>
                {isZh ? "域名预览：" : "Domain preview: "}
                {modeText(isZh, "查询", "Lookup")}{" "}
                <span className="font-mono text-white">{query.trim().toLowerCase()}</span>
                {overview.lastLookup?.name === query.trim().toLowerCase() ? (
                  <>
                    {" "}
                    · {overview.lastLookup.available ? (isZh ? "可注册" : "Available") : isZh ? "已注册" : "Registered"}
                    {!overview.lastLookup.available
                      ? ` · ${isZh ? "地板价" : "floor"} ${overview.lastLookup.marketplace.floorIon} ION`
                      : null}
                  </>
                ) : null}
              </span>
            ) : (
              <span>
                {isZh
                  ? "输入有效 .ion 域名后可查询可用性与注册费用。"
                  : "Enter a valid .ion label to preview availability and registration cost."}
              </span>
            )}
          </motion.div>

          <motion.div className="flex flex-wrap gap-2">
            <NeonButton data-testid="domain-submit" disabled={!validation.isValid || busy} type="submit">
              {isZh ? "查询域名" : "Lookup Domain"}
            </NeonButton>
            <NeonButton
              className="!bg-emerald-500/20"
              data-testid="domain-manage-register-btn"
              disabled={!validation.isValid || busy}
              onClick={() => void runRegister()}
              type="button"
            >
              {isZh ? `注册 (${overview.feeIon.register} ION)` : `Register (${overview.feeIon.register} ION)`}
            </NeonButton>
          </motion.div>
        </form>
      </GlassPanel>

      <GlassPanel testId="domain-manage-owned" title={isZh ? "已拥有域名" : "Owned Domains"}>
        <div className="grid gap-3" data-testid="domain-manage-owned-list">
          {overview.owned.length === 0 ? (
            <p className="text-sm text-white/55">
              {isZh ? "暂无域名，请先注册。" : "No domains yet. Register one first."}
            </p>
          ) : (
            overview.owned.map((entry) => (
              <button
                key={entry.name}
                className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                  selectedName === entry.name
                    ? "border-cyan-300/40 bg-cyan-400/[0.08]"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
                data-testid={`domain-manage-owned-row-${entry.name}`}
                onClick={() => setSelectedName(entry.name)}
                type="button"
              >
                <span className="font-semibold text-white">{entry.name}</span>
                <span className="text-xs text-white/55">
                  {isZh ? "到期" : "Expires"} {new Date(entry.expiresAt).toLocaleDateString()} ·{" "}
                  {entry.status === "expiring" ? (isZh ? "即将到期" : "Expiring") : isZh ? "正常" : "Active"}
                </span>
                {entry.bindTarget ? (
                  <span className="truncate font-mono text-xs text-cyan-200/80">
                    {isZh ? "绑定" : "Bound to"} {entry.bindTarget}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </GlassPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel testId="domain-manage-bind-card" title={isZh ? "绑定钱包" : "Bind Wallet"}>
          <div className="grid gap-3">
            <p className="text-sm text-white/60">
              {isZh ? `当前操作域名：${selectedName}` : `Current domain: ${selectedName}`}
            </p>
            <input
              aria-label={isZh ? "绑定钱包地址" : "Bind wallet address"}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              data-testid="domain-manage-bind-wallet"
              onChange={(event) => setBindWallet(event.target.value)}
              value={bindWallet}
            />
            <NeonButton data-testid="domain-manage-bind-btn" disabled={busy} onClick={() => void runBind()} type="button">
              {isZh ? "绑定解析" : "Bind Resolver"}
            </NeonButton>
          </div>
        </GlassPanel>

        <GlassPanel testId="domain-manage-transfer-card" title={isZh ? "转移域名" : "Transfer Domain"}>
          <motion.div className="grid gap-3">
            <p className="text-sm text-white/60">
              {isZh ? `费用 ${overview.feeIon.transfer} ION` : `Fee ${overview.feeIon.transfer} ION`}
            </p>
            <input
              aria-label={isZh ? "转移目标地址" : "Transfer recipient"}
              className="rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
              data-testid="domain-manage-transfer-to"
              onChange={(event) => setTransferTo(event.target.value)}
              value={transferTo}
            />
            <NeonButton
              data-testid="domain-manage-transfer-btn"
              disabled={busy}
              onClick={() => void runTransfer()}
              type="button"
            >
              {isZh ? "发起转移" : "Submit Transfer"}
            </NeonButton>
          </motion.div>
        </GlassPanel>

        <GlassPanel testId="domain-manage-renew-card" title={isZh ? "续费域名" : "Renew Domain"}>
          <div className="grid gap-3">
            <p className="text-sm text-white/60">
              {isZh
                ? `续费 ${selectedName} · ${overview.feeIon.renew} ION / 年`
                : `Renew ${selectedName} · ${overview.feeIon.renew} ION / year`}
            </p>
            <NeonButton data-testid="domain-manage-renew-btn" disabled={busy} onClick={() => void runRenew()} type="button">
              {isZh ? "续费一年" : "Renew 1 Year"}
            </NeonButton>
          </div>
        </GlassPanel>
      </div>

      {message ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="domain-confirmation"
        >
          {message}
        </p>
      ) : null}
    </motion.div>
  );
}

function modeText(isZh: boolean, zh: string, en: string) {
  return isZh ? zh : en;
}
