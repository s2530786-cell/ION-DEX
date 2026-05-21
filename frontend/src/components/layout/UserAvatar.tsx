import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { useIonWallet } from "@/context/IonWalletContext";
import { shortenAddress } from "@/wallet/injectedEvm";
import { shortenIonAddress } from "@/wallet/ionTypes";
import {
  EVM_WALLET_LABELS,
  isEvmWalletAvailable,
  type EvmWalletKind,
} from "@/wallet/evmConnectors";
import type { IonWalletKind } from "@/wallet/ionTypes";
import { isIonExtensionInstalled } from "@/wallet/ionExtension";

// ── Types ──────────────────────────────────────────────────────
type WalletProviderKey = EvmWalletKind | IonWalletKind;

type WalletProvider = {
  key: WalletProviderKey;
  name: string;
  label: string;
  family: "evm" | "ion";
};

const EVM_WALLET_KINDS: EvmWalletKind[] = [
  "metamask",
  "binance",
  "okx",
  "bitget",
  "trust",
  "coinbase",
  "rabby",
];

const ION_PROVIDER_KEYS: IonWalletKind[] = ["ion-browser", "online", "walletconnect"];

// Master 钦定：ION 原生钱包排最前，第三方 EVM 钱包靠后
const walletProviders: WalletProvider[] = [
  // 🥇 ION 生态钱包 (优先)
  { key: "ion-browser", name: "ION Wallet", label: "Browser Extension (ice.io)", family: "ion" as const },
  { key: "online", name: "Online+ Wallet", label: "wallet.ice.io", family: "ion" as const },
  // 🥈 TonConnect 通用协议
  { key: "walletconnect", name: "TonConnect", label: "WalletConnect Protocol", family: "ion" as const },
  // 🥉 BSC EVM 钱包
  ...EVM_WALLET_KINDS.map((kind) => ({
    key: kind,
    name: EVM_WALLET_LABELS[kind],
    label: "BSC EIP-1193",
    family: "evm" as const,
  })),
];

// ── Component ──────────────────────────────────────────────────
export function UserAvatar() {
  const evmWallet = useEvmWallet();
  const ionWallet = useIonWallet();
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"info" | "connect" | "domain">("info");
  const [connectedProvider, setConnectedProvider] = useState<WalletProviderKey | null>(null);
  const connectedProviderName =
    walletProviders.find((p) => p.key === connectedProvider)?.name ?? connectedProvider ?? "";

  const ionSessionActive = Boolean(
    ionWallet.status === "connected" &&
      ionWallet.snapshot &&
      connectedProvider !== null &&
      ION_PROVIDER_KEYS.includes(connectedProvider as IonWalletKind),
  );

  const evmConnected = evmWallet.status === "connected" && evmWallet.snapshot;
  const ionConnected = ionSessionActive && ionWallet.snapshot;

  const showInjectedSession = evmConnected && connectedProvider && EVM_WALLET_KINDS.includes(connectedProvider as EvmWalletKind);
  const showIonSession = ionConnected && connectedProvider;

  const connected = showInjectedSession || showIonSession;

  // ── Avatar display ──────────────────────────────────────────
  const avatarLabel = useMemo(() => {
    if (showInjectedSession && evmWallet.snapshot) return shortenAddress(evmWallet.snapshot.address);
    if (showIonSession && ionWallet.snapshot) return shortenIonAddress(ionWallet.snapshot.address);
    return null;
  }, [showInjectedSession, showIonSession, evmWallet.snapshot, ionWallet.snapshot]);

  const avatarInitial = useMemo(() => {
    if (showInjectedSession && evmWallet.snapshot) return evmWallet.snapshot.address.slice(2, 4).toUpperCase();
    if (showIonSession && ionWallet.snapshot) return ionWallet.snapshot.address.slice(0, 2).toUpperCase();
    return "W";
  }, [showInjectedSession, showIonSession, evmWallet.snapshot, ionWallet.snapshot]);

  // ── Sync connected provider ────────────────────────────────
  useMemo(() => {
    if (ionWallet.status === "connected" && ionWallet.snapshot && ION_PROVIDER_KEYS.includes(ionWallet.snapshot.kind)) {
      setConnectedProvider(ionWallet.snapshot.kind);
    }
    if (evmWallet.status === "connected" && evmWallet.activeWallet) {
      setConnectedProvider(evmWallet.activeWallet);
    }
  }, [evmWallet.activeWallet, evmWallet.status, ionWallet.snapshot, ionWallet.status]);

  // ── Handlers ────────────────────────────────────────────────
  const handleConnect = useCallback(
    async (provider: WalletProvider) => {
      if (provider.family === "evm") {
        await evmWallet.connectWallet(provider.key as EvmWalletKind);
      } else {
        await ionWallet.connect(provider.key as IonWalletKind);
      }
      setConnectedProvider(provider.key);
      setTab("info");
    },
    [evmWallet, ionWallet],
  );

  const handleDisconnect = useCallback(() => {
    setConnectedProvider(null);
    evmWallet.disconnect();
    ionWallet.disconnect();
    setTab("info");
  }, [evmWallet, ionWallet]);

  const copyAddress = useCallback(() => {
    const addr =
      showInjectedSession && evmWallet.snapshot
        ? evmWallet.snapshot.address
        : showIonSession && ionWallet.snapshot
          ? ionWallet.snapshot.address
          : null;
    if (addr) void navigator.clipboard.writeText(addr);
  }, [showInjectedSession, showIonSession, evmWallet.snapshot, ionWallet.snapshot]);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Avatar Button — 7-layer glass pill */}
      <NeonButton
        aria-expanded={panelOpen}
        className="flex items-center gap-2.5 px-3 py-1.5"
        data-testid="user-avatar"
        data-testid-extra="wallet-connect"
        onClick={() => setPanelOpen((o) => !o)}
        type="button"
      >
        {/* Avatar circle with gradient + neon ring */}
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black shadow-neonCyan transition-all ${
            connected
              ? "bg-gradient-to-br from-cyan-400/30 to-violet-400/30 ring-2 ring-cyan-300/40"
              : "bg-white/[0.08] ring-1 ring-white/15"
          }`}
        >
          {connected ? (
            <CheckCircle2 size={16} className="text-cyan-200" />
          ) : (
            <User size={16} className="text-cyan-100/70" />
          )}
        </div>
        {avatarLabel ? (
          <span className="text-xs font-bold text-cyan-50">{avatarLabel}</span>
        ) : (
          <Wallet size={15} className="text-cyan-100/50" />
        )}
      </NeonButton>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(24rem,calc(100vw-2rem))] rounded-[1.6rem] border border-cyan-200/20 bg-slate-950/95 p-4 shadow-[0_0_48px_rgba(36,247,255,0.20)] backdrop-blur-2xl"
            data-testid="wallet-panel"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tab bar */}
            <div className="mb-4 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              {(["info", "connect", "domain"] as const).map((t) => (
                <button
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                    tab === t ? "bg-cyan-300/[0.12] text-cyan-100 shadow-neonCyan" : "text-cyan-100/45"
                  }`}
                  key={t}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t === "info" ? "Wallet" : t === "connect" ? "Connect" : "Domain"}
                </button>
              ))}
            </div>

            {/* ── Tab: Info ──────────────────────────────────── */}
            {tab === "info" && (
              <div className="grid gap-3">
                {!connected && (
                  <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-100/75">
                    No wallet connected. Switch to Connect tab.
                  </p>
                )}

                {/* EVM session */}
                {showInjectedSession && evmWallet.snapshot && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3"
                    initial={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 ring-1 ring-emerald-300/30">
                        <span className="text-xs font-black text-emerald-200">{avatarInitial}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-emerald-100">
                          {connectedProviderName} on chain {evmWallet.snapshot.chainId}
                        </p>
                        <p className="truncate font-mono text-xs text-emerald-100/70">
                          {evmWallet.snapshot.address}
                        </p>
                      </div>
                      <button
                        className="rounded-full p-1.5 text-emerald-100/60 transition hover:text-emerald-100"
                        onClick={copyAddress}
                        title="Copy address"
                        type="button"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-emerald-100/60">
                      BNB: {evmWallet.snapshot.balanceBnb ? `${evmWallet.snapshot.balanceBnb} BNB` : "N/A"}
                    </p>
                  </motion.div>
                )}

                {/* ION session */}
                {showIonSession && ionWallet.snapshot && (
                  <motion.div
                    animate={{ opacity: 1 }}
                    className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-3"
                    initial={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 ring-1 ring-violet-300/30">
                        <span className="text-xs font-black text-violet-200">{avatarInitial}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-violet-100">
                          {connectedProviderName} · {ionWallet.snapshot.network}
                        </p>
                        <p className="truncate font-mono text-xs text-violet-100/70">
                          {ionWallet.snapshot.address}
                        </p>
                      </div>
                      <button
                        className="rounded-full p-1.5 text-violet-100/60 transition hover:text-violet-100"
                        onClick={copyAddress}
                        title="Copy address"
                        type="button"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-violet-100/60">
                      ION: {ionWallet.snapshot.balanceIon ? `${ionWallet.snapshot.balanceIon} ION` : "N/A"}
                    </p>
                  </motion.div>
                )}

                {connected && (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[0.12]"
                      onClick={() => {
                        void evmWallet.refreshBalance();
                        void ionWallet.refreshBalance();
                      }}
                      type="button"
                    >
                      <RefreshCw size={12} className="mr-1 inline" />
                      Refresh
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 rounded-full border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs font-black text-rose-100 transition hover:bg-rose-300/[0.14]"
                      data-testid="wallet-disconnect"
                      onClick={handleDisconnect}
                      type="button"
                    >
                      <LogOut size={12} />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Connect ────────────────────────────────── */}
            {tab === "connect" && (
              <div className="grid gap-2">
                {evmWallet.error && (
                  <p className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs text-rose-100">
                    {evmWallet.error}
                  </p>
                )}
                {ionWallet.error && (
                  <p className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-3 py-2 text-xs text-rose-100">
                    {ionWallet.error}
                  </p>
                )}
                {walletProviders.map((provider) => (
                  <button
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan-200/30 hover:bg-cyan-300/[0.07]"
                    data-testid={`wallet-provider-${provider.key}`}
                    disabled={
                      (provider.family === "evm" && !isEvmWalletAvailable(provider.key as EvmWalletKind)) ||
                      (provider.key === "ion-browser" && !isIonExtensionInstalled())
                    }
                    key={provider.key}
                    onClick={() => void handleConnect(provider)}
                    type="button"
                  >
                    <span className="text-sm font-black text-white">{provider.name}</span>
                    <span className="mt-1 block text-xs text-cyan-100/55">{provider.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Tab: Domain ─────────────────────────────────── */}
            {tab === "domain" && (
              <div className="grid gap-3">
                <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.05] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe2 size={18} className="text-violet-300" />
                    <p className="text-sm font-black text-violet-100">ION Domain (dns.ice.io)</p>
                  </div>
                  <div className="grid gap-2">
                    <NeonButton
                      className="w-full text-xs"
                      onClick={() => window.open("https://dns.ice.io", "_blank")}
                      type="button"
                    >
                      <ExternalLink size={12} className="mr-1.5 inline" />
                      Open dns.ice.io
                    </NeonButton>
                    <p className="text-xs text-violet-100/50 text-center mt-1">
                      Domain registration · bidding · transfer via ION DNS contracts
                    </p>
                  </div>
                </div>

                {connected && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-3">
                    <p className="text-xs text-amber-100/70 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Connected wallet can bind ION domains. Full domain management coming via backend integration.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              className="absolute right-3 top-3 rounded-full p-1 text-cyan-100/40 transition hover:text-cyan-100"
              onClick={() => setPanelOpen(false)}
              type="button"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
