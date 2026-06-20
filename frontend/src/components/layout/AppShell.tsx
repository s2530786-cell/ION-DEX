import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Globe2,
  Hexagon,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { ScanlineOverlay } from "@/components/ui/ScanlineOverlay";
import { getNavGroups, navLabelForPage } from "@/components/layout/appNav";
import { FooterLegal } from "@/components/layout/FooterLegal";
import { NeonButton } from "@/components/ui/NeonButton";
import { IonConnectModalBridge } from "@/components/wallet/IonConnectModalBridge";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { useIonWallet } from "@/context/IonWalletContext";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";
import { BSC_CHAIN_ID, DEMO_TICKER_FALLBACK, ION_CHAIN_ID_SCAFFOLD } from "@/lib/integrationConfig";
import { evmChainLabel } from "@/wallet/evmChains";
import { shortenAddress } from "@/wallet/injectedEvm";
import {
  EVM_WALLET_KIND_ORDER,
  EVM_WALLET_LABELS,
  isEvmWalletAvailable,
  type EvmWalletKind,
} from "@/wallet/evmConnectors";
import type { IonWalletKind } from "@/wallet/ionTypes";
import { isIonExtensionInstalled } from "@/wallet/ionExtension";

export type PageKey =
  | "dashboard"
  | "swap"
  | "trade"
  | "trade-pro"
  | "approve-manager"
  | "vault-stake"
  | "grid"
  | "pool"
  | "stake"
  | "bridge"
  | "burn"
  | "domain"
  | "ai"
  | "ai-trading"
  | "copy-trade"
  | "batch-transfer"
  | "liquidity-mine"
  | "settings";

export { navItems } from "@/components/layout/appNav";

type AppShellProps = PropsWithChildren<{
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
}>;

function shortenIonAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const ION_PROVIDER_KEYS: IonWalletKind[] = ["ion-browser", "online", "walletconnect"];

export function AppShell({ activePage, children, onPageChange }: AppShellProps) {
  const { locale, isZh, toggleLocale } = useI18n();
  const evmWallet = useEvmWallet();
  const ionWallet = useIonWallet();
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<WalletProviderKey | null>(null);
  const navGroups = useMemo(() => getNavGroups(locale), [locale]);
  const activePageLabel = useMemo(() => navLabelForPage(activePage, locale), [activePage, locale]);
  const selectedProvider = useMemo(
    () => walletProviders.find((provider) => provider.key === connectedProvider) ?? null,
    [connectedProvider],
  );
  const ionSessionActive = Boolean(
    ionWallet.status === "connected" &&
      ionWallet.snapshot &&
      connectedProvider !== null &&
      ION_PROVIDER_KEYS.includes(connectedProvider as IonWalletKind),
  );
  const walletButtonLabel = useMemo(() => {
    if (evmWallet.status === "connected" && evmWallet.snapshot) {
      return shortenAddress(evmWallet.snapshot.address);
    }
    if (ionSessionActive && ionWallet.snapshot) {
      return shortenIonAddress(ionWallet.snapshot.address);
    }
    return isZh ? "连接钱包" : "Wallet Connect";
  }, [evmWallet.snapshot, evmWallet.status, ionSessionActive, ionWallet.snapshot, isZh]);

  useEffect(() => {
    if (
      ionWallet.status === "connected" &&
      ionWallet.snapshot &&
      ION_PROVIDER_KEYS.includes(ionWallet.snapshot.kind) &&
      connectedProvider !== ionWallet.snapshot.kind
    ) {
      setConnectedProvider(ionWallet.snapshot.kind);
    }
    if (
      evmWallet.status === "connected" &&
      evmWallet.activeWallet &&
      connectedProvider !== evmWallet.activeWallet
    ) {
      setConnectedProvider(evmWallet.activeWallet);
    }
    if (ionWallet.status === "disconnected" && connectedProvider && ION_PROVIDER_KEYS.includes(connectedProvider as IonWalletKind)) {
      setConnectedProvider(null);
    }
    if (
      evmWallet.status === "disconnected" &&
      connectedProvider &&
      EVM_WALLET_KIND_ORDER.includes(connectedProvider as EvmWalletKind)
    ) {
      setConnectedProvider(null);
    }
  }, [connectedProvider, evmWallet.activeWallet, evmWallet.status, ionWallet.snapshot, ionWallet.status]);

  function selectPage(page: PageKey) {
    onPageChange(page);
    setMobileNavOpen(false);
    setWalletPanelOpen(false);
  }

  useEffect(() => {
    setWalletPanelOpen(false);
  }, [activePage]);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col text-white">
      <IonConnectModalBridge />
      <AuroraGalaxyBackground />
      <ScanlineOverlay opacity={0.025} speed={10} />
      <div className="relative z-0 mx-auto flex min-h-[100dvh] min-h-[100svh] w-full max-w-[1440px] flex-col md:flex-row md:px-4 md:py-4 lg:px-6">
        <aside
          aria-label={isZh ? "侧边栏" : "Sidebar"}
          className="hidden min-h-0 w-[15.5rem] shrink-0 flex-col border-cyan-400/10 bg-black/75 md:flex md:rounded-l-[1.75rem] md:border md:border-r-0 md:shadow-cyberPanel backdrop-blur-xl"
          data-testid="app-sidebar"
        >
          <div className="shrink-0 p-4 pb-2">
            <SidebarBrand isZh={isZh} />
          </div>
          <NavList
            activePage={activePage}
            className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
            groups={navGroups}
            isZh={isZh}
            onSelect={selectPage}
          />
        </aside>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.button
                animate={{ opacity: 1 }}
                aria-label={isZh ? "关闭导航菜单" : "Close navigation menu"}
                className="fixed inset-0 z-40 bg-black/60 md:hidden"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                type="button"
              />
              <motion.aside
                animate={{ x: 0 }}
                aria-label={isZh ? "移动端导航" : "Mobile navigation"}
                className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] min-h-0 flex-col border-r border-cyan-400/15 bg-black/92 shadow-cyberPanel backdrop-blur-xl md:hidden"
                data-testid="app-mobile-nav"
                exit={{ x: "-100%" }}
                initial={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              >
                <div className="flex shrink-0 items-center justify-between gap-3 p-4 pb-2">
                  <SidebarBrand isZh={isZh} />
                  <button
                    aria-label={isZh ? "关闭菜单" : "Close menu"}
                    className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80"
                    data-testid="nav-close"
                    onClick={() => setMobileNavOpen(false)}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
                <NavList
                  activePage={activePage}
                  className="min-h-0 flex-1 overflow-y-auto"
                  groups={navGroups}
                  isZh={isZh}
                  onSelect={selectPage}
                />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none border-0 border-cyan-400/10 bg-black/70 shadow-cyberPanel backdrop-blur-xl md:rounded-[1.75rem] md:border">
          <div className="sticky top-0 z-30 shrink-0 border-b border-cyan-400/10 bg-black/88 backdrop-blur-md">
          <header className="flex shrink-0 flex-nowrap items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                aria-expanded={mobileNavOpen}
                aria-label={isZh ? "打开导航菜单" : "Open navigation menu"}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 md:hidden"
                data-testid="nav-menu"
                onClick={() => setMobileNavOpen(true)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:hidden">
                <BrandMark size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-base font-black tracking-wide text-glow-cyan sm:text-lg" data-testid="brand-title">
                    ION DEX
                  </p>
                  <p className="truncate text-[11px] text-cyan-100/55 sm:text-xs">
                    {activePageLabel}
                  </p>
                </div>
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/55">{isZh ? "当前页面" : "Current page"}</p>
                <p className="truncate text-sm font-bold text-white">{activePageLabel}</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 sm:block"
                aria-label={isZh ? "切换语言" : "Switch language"}
                data-testid="locale-toggle"
                onClick={toggleLocale}
                title={isZh ? "切换到 English" : "Switch to 简体中文"}
              >
                <Globe2 size={18} />
              </button>
              <button
                type="button"
                className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 sm:block"
                aria-label={isZh ? "通知" : "Notifications"}
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-cyan-100/90 md:flex"
              >
                <ShieldCheck size={16} />
                ION ID
              </button>
              <NeonButton
                aria-expanded={walletPanelOpen}
                className="flex items-center gap-2 px-4 py-2"
                data-testid="wallet-connect"
                onClick={() => setWalletPanelOpen((open) => !open)}
                type="button"
              >
                <Wallet size={16} />
                {walletButtonLabel}
              </NeonButton>

            </div>
          </header>

          <TickerStrip />

          </div>

          {walletPanelOpen ? (
            <WalletConnectOverlay
              connectedProvider={selectedProvider}
              evmWallet={evmWallet}
              ionWallet={ionWallet}
              ionSessionActive={ionSessionActive}
              isZh={isZh}
              onClose={() => setWalletPanelOpen(false)}
              onConnect={(provider) => setConnectedProvider(provider)}
              onDisconnect={() => {
                setConnectedProvider(null);
                evmWallet.disconnect();
                ionWallet.disconnect();
                setWalletPanelOpen(false);
              }}
            />
          ) : null}

          <main className="relative z-0 flex min-h-0 flex-1 flex-col" data-testid="main-content">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
              <div className="mx-auto w-full min-w-0 max-w-[1600px]">{children}</div>
            </div>
          </main>
          <FooterLegal />
        </div>
      </div>
    </div>
  );
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box =
    size === "sm"
      ? "h-8 w-8 rounded-lg"
      : "h-9 w-9 rounded-xl";
  const iconSize = size === "sm" ? 16 : 18;
  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center border border-cyan-300/25 bg-[linear-gradient(135deg,rgba(36,247,255,0.18),rgba(141,77,255,0.22))] ${box}`}
    >
      <Hexagon className="text-cyan-200" size={iconSize} strokeWidth={1.75} />
    </div>
  );
}

function SidebarBrand({ isZh }: { isZh: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="min-w-0">
        <p className="text-base font-black tracking-wide text-white" data-testid="brand-title">
          ION DEX
        </p>
        <p className="truncate text-[11px] text-cyan-100/50">{isZh ? "Web3 交易" : "Web3 Trading"}</p>
      </div>
    </div>
  );
}

function NavList({
  activePage,
  className = "",
  groups,
  isZh,
  onSelect,
}: {
  activePage: PageKey;
  className?: string;
  groups: ReturnType<typeof getNavGroups>;
  isZh: boolean;
  onSelect: (page: PageKey) => void;
}) {
  return (
    <nav aria-label={isZh ? "侧边栏导航" : "Sidebar navigation"} className={`grid gap-4 ${className}`}>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/40">
            {group.label}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => {
              const active = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] font-bold transition ${
                    active
                      ? "bg-white/15 text-white shadow-[0_0_14px_rgba(36,247,255,0.18)]"
                      : item.preview
                        ? "text-slate-400/90 hover:bg-white/[0.06] hover:text-slate-200"
                        : "text-slate-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`nav-${item.key}`}
                  onClick={() => onSelect(item.key)}
                >
                  {item.key === "dashboard" ? (
                    <LayoutDashboard className="shrink-0 text-cyan-200/80" size={15} />
                  ) : (
                    <span
                      aria-hidden
                      className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/40"
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                  {item.preview ? (
                    <span className="ml-auto shrink-0 rounded-md border border-amber-300/25 bg-amber-300/[0.08] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-100/90">
                      {isZh ? "预览" : "Preview"}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

type WalletProviderKey = EvmWalletKind | IonWalletKind;

type WalletProvider = {
  key: WalletProviderKey;
  name: string;
  label: string;
  family: "evm" | "ion";
};

const walletProviders: WalletProvider[] = [
  ...EVM_WALLET_KIND_ORDER.map((kind) => ({
    key: kind,
    name: EVM_WALLET_LABELS[kind],
    label: "BSC / ION scaffold · EIP-1193 · EIP-6963",
    family: "evm" as const,
  })),
  {
    key: "online",
    name: "Online+ Wallet",
    label: "wallet.ice.io · postMessage (Phase 2+ — reconnect each session)",
    family: "ion",
  },
  {
    key: "ion-browser",
    name: "ION Browser Wallet",
    label: "window.ton · official extension",
    family: "ion",
  },
  {
    key: "walletconnect",
    name: "TonConnect (ION)",
    label: "TonConnect SDK · WalletConnect v2 scaffold (QR when configured)",
    family: "ion",
  },
];

function walletProviderLabel(provider: WalletProvider, isZh: boolean): string {
  if (!isZh) {
    return provider.label;
  }

    switch (provider.key) {
      case "online":
        return "wallet.ice.io · postMessage（Phase 2+，每次会话需重新连接）";
      case "ion-browser":
        return "window.ton · 官方扩展";
      case "walletconnect":
        return "TonConnect SDK · WalletConnect v2 脚手架（配置后可用二维码）";
      default:
        return "BSC / ION 脚手架 · EIP-1193 · EIP-6963";
    }
  }

function WalletConnectOverlay({
  connectedProvider,
  evmWallet,
  ionWallet,
  ionSessionActive,
  isZh,
  onClose,
  onConnect,
  onDisconnect,
}: {
  connectedProvider: WalletProvider | null;
  evmWallet: ReturnType<typeof useEvmWallet>;
  ionWallet: ReturnType<typeof useIonWallet>;
  ionSessionActive: boolean;
  isZh: boolean;
  onClose: () => void;
  onConnect: (provider: WalletProviderKey) => void;
  onDisconnect: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <>
      <button
        aria-label={isZh ? "关闭钱包面板" : "Close wallet panel"}
        className="fixed inset-0 z-[65] bg-[#030818]/80 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="pointer-events-none fixed inset-0 z-[66] flex items-start justify-end p-3 pt-[max(4.25rem,env(safe-area-inset-top))] sm:p-4 sm:pt-[4.75rem]">
        <div className="pointer-events-auto w-full max-w-[22rem]">
          <WalletConnectPanel
            connectedProvider={connectedProvider}
            evmWallet={evmWallet}
            ionWallet={ionWallet}
            ionSessionActive={ionSessionActive}
            isZh={isZh}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}

function WalletConnectPanel({
  connectedProvider,
  evmWallet,
  ionWallet,
  ionSessionActive,
  isZh,
  onConnect,
  onDisconnect,
}: {
  connectedProvider: WalletProvider | null;
  evmWallet: ReturnType<typeof useEvmWallet>;
  ionWallet: ReturnType<typeof useIonWallet>;
  ionSessionActive: boolean;
  isZh: boolean;
  onConnect: (provider: WalletProviderKey) => void;
  onDisconnect: () => void;
}) {
  const evmConnected = evmWallet.status === "connected" && evmWallet.snapshot;
  const showInjectedSession =
    connectedProvider?.family === "evm" &&
    evmConnected &&
    EVM_WALLET_KIND_ORDER.includes(connectedProvider.key as EvmWalletKind);
  const showIonSession = ionSessionActive && ionWallet.snapshot && connectedProvider;
  const shellLabel = isZh ? "钱包面板" : "Wallet panel";
  const evmWalletLabel = isZh ? "EVM 钱包" : "EVM wallet";
  const ionWalletLabel = isZh ? "ION 钱包" : "ION wallet";
  const chooseProviderLabel = isZh ? "选择钱包" : "Choose wallet";
  const refreshBalanceLabel = isZh ? "刷新余额" : "Refresh balance";
  const disconnectLabel = isZh ? "断开连接" : "Disconnect";

  return (
    <div
      className="max-h-[min(32rem,calc(100dvh-6rem))] overflow-y-auto rounded-[1.6rem] border border-cyan-200/25 bg-[#070d1f] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_36px_rgba(36,247,255,0.18)]"
      data-testid="wallet-panel"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-200 shadow-neonCyan">
          {connectedProvider ? <CheckCircle2 size={22} /> : <Wallet size={22} />}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/50">
            {showInjectedSession ? evmWalletLabel : showIonSession ? ionWalletLabel : shellLabel}
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {showInjectedSession
              ? shortenAddress(evmWallet.snapshot!.address)
              : showIonSession
                ? shortenIonAddress(ionWallet.snapshot!.address)
                : connectedProvider
                  ? connectedProvider.name
                  : chooseProviderLabel}
          </p>
        </div>
      </div>

      {showInjectedSession ? (
        <motion.div className="grid gap-3" data-testid="profile-menu">
          <motion.div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3 text-sm text-emerald-100">
            <p className="font-black" data-testid="wallet-confirmation">
              {isZh
                ? `${connectedProvider!.name} 已连接到链 ${evmWallet.snapshot!.chainId}`
                : `${connectedProvider!.name} connected on chain ${evmWallet.snapshot!.chainId}`}
            </p>
            <p className="mt-1 font-mono text-xs text-emerald-100/80">{evmWallet.snapshot!.address}</p>
            <p className="mt-2 text-emerald-100/70">
              {isZh ? "BNB 余额: " : "BNB balance: "}
              {evmWallet.snapshot!.balanceBnb
                ? `${evmWallet.snapshot!.balanceBnb} BNB`
                : isZh
                  ? "暂不可用（请启动 :8788 backend 或检查 RPC）"
                  : "unavailable (start backend on :8788 or check RPC)"}{" "}
              · {isZh ? "来源" : "source"}: {evmWallet.snapshot!.balanceSource}
            </p>
          </motion.div>
          <div className="flex flex-wrap gap-2" data-testid="evm-chain-switch">
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                evmWallet.targetChainId === BSC_CHAIN_ID
                  ? "border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-50"
                  : "border-white/10 bg-white/[0.04] text-cyan-100/60"
              }`}
              onClick={() => void evmWallet.switchChain(BSC_CHAIN_ID)}
              type="button"
            >
              {evmChainLabel(BSC_CHAIN_ID)}
            </button>
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                evmWallet.targetChainId === ION_CHAIN_ID_SCAFFOLD
                  ? "border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-50"
                  : "border-white/10 bg-white/[0.04] text-cyan-100/60"
              }`}
              onClick={() => void evmWallet.switchChain(ION_CHAIN_ID_SCAFFOLD)}
              type="button"
            >
              {evmChainLabel(ION_CHAIN_ID_SCAFFOLD)}
            </button>
          </div>
          <button
            className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-2 text-sm font-black text-cyan-100"
            onClick={() => void evmWallet.refreshBalance()}
            type="button"
          >
            {refreshBalanceLabel}
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/[0.08] px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-300/[0.14]"
            data-testid="wallet-disconnect"
            onClick={onDisconnect}
            type="button"
          >
            <LogOut size={16} />
            {disconnectLabel}
          </button>
        </motion.div>
      ) : showIonSession ? (
        <motion.div className="grid gap-3" data-testid="profile-menu">
          <motion.div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3 text-sm text-emerald-100">
            <p className="font-black" data-testid="wallet-confirmation">
              {isZh
                ? `${connectedProvider!.name} 已连接 · ${ionWallet.snapshot!.network}`
                : `${connectedProvider!.name} connected · ${ionWallet.snapshot!.network}`}
            </p>
            <p className="mt-1 font-mono text-xs text-emerald-100/80">{ionWallet.snapshot!.address}</p>
            <p className="mt-2 text-emerald-100/70">
              {isZh ? "ION 余额: " : "ION balance: "}
              {ionWallet.snapshot!.balanceIon
                ? `${ionWallet.snapshot!.balanceIon} ION`
                : isZh ? "暂不可用（RPC 或扩展未就绪）" : "unavailable (RPC or extension)"}{" "}
              · {isZh ? "来源" : "source"}: {ionWallet.snapshot!.balanceSource}
            </p>
          </motion.div>
          <button
            className="rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-2 text-sm font-black text-cyan-100"
            onClick={() => void ionWallet.refreshBalance()}
            type="button"
          >
            {refreshBalanceLabel}
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/[0.08] px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-300/[0.14]"
            data-testid="wallet-disconnect"
            onClick={onDisconnect}
            type="button"
          >
            <LogOut size={16} />
            {disconnectLabel}
          </button>
        </motion.div>
      ) : (
        <motion.div className="grid gap-2">
          {evmWallet.error ? (
            <p className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-3 py-2 text-xs text-rose-100">
              {evmWallet.error}
            </p>
          ) : null}
          {ionWallet.error ? (
            <p className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-3 py-2 text-xs text-rose-100">
              {ionWallet.error}
            </p>
          ) : null}
          {walletProviders.map((provider) => (
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid={`wallet-provider-${provider.key}`}
              disabled={
                (provider.family === "evm" && !isEvmWalletAvailable(provider.key as EvmWalletKind)) ||
                (provider.key === "ion-browser" && !isIonExtensionInstalled())
              }
              key={provider.key}
              onClick={() => {
                if (provider.family === "evm") {
                  void evmWallet
                    .connectWallet(provider.key as EvmWalletKind)
                    .then(() => onConnect(provider.key));
                  return;
                }
                void ionWallet.connect(provider.key as IonWalletKind).then(() => onConnect(provider.key));
              }}
              type="button"
            >
              <span className="block text-sm font-black text-white">{provider.name}</span>
              <span className="mt-1 block text-xs text-cyan-100/55">{walletProviderLabel(provider, isZh)}</span>
              {provider.family === "evm" && !isEvmWalletAvailable(provider.key as EvmWalletKind) ? (
                <span className="mt-1 block text-xs text-amber-200/80">{isZh ? "未检测到钱包扩展" : "Wallet extension not detected"}</span>
              ) : null}
              {provider.key === "ion-browser" && !isIonExtensionInstalled() ? (
                <span className="mt-1 block text-xs text-amber-200/80">
                  {isZh ? "请安装 ION Browser Wallet 扩展" : "Install ION browser wallet extension"}
                </span>
              ) : null}
            </button>
          ))}
          <p className="mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-100/75">
            {isZh
              ? "ION 钱包逻辑来自官方仓库：ion-browser-wallet（window.ton）、wallet.ice.io（Online+）和扩展内 TonConnect 桥。BSC 侧使用 MetaMask / Injected + 后端 RPC。"
              : "ION wallet flows follow the official repos: ion-browser-wallet (window.ton), wallet.ice.io (Online+), and the embedded TonConnect bridge. The BSC side uses MetaMask / injected providers with backend RPC."}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function TickerStrip() {
  const { isZh } = useI18n();
  const [privacyMode] = useState(false);
  const [tickers, setTickers] = useState<MarketTicker[] | null>(null);
  const [sourceLabel, setSourceLabel] = useState(isZh ? "加载中…" : "Loading…");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    fetchMarketTickers(controller.signal)
      .then((response) => {
        setTickers(response.data);
        setSourceLabel(`${response.meta.source} API`);
      })
      .catch((err) => {
        console.error("TickerStrip fetch failed:", err.message);
        setTickers(null);
        setSourceLabel(isZh ? "数据加载失败" : "data unavailable");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isZh]);

  if (!tickers || tickers.length === 0) {
    return (
      <div
        className="relative shrink-0 overflow-hidden px-4 py-2 text-xs sm:px-6"
        data-testid="ticker-strip"
      >
        <span className="text-cyan-100/60">{sourceLabel}</span>
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden px-4 py-2 text-xs sm:px-6"
      data-testid="ticker-strip"
    >
      <span className="sr-only" data-testid="ticker-source">
        {isZh ? "行情来源" : "Ticker source"}: {sourceLabel}
      </span>
      <div className="flex min-w-max animate-[ticker_36s_linear_infinite] gap-4">
        {[...tickers, ...tickers].map((ticker, index) => (
          <span
            key={`${ticker.symbol}-${index}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"
          >
            <strong className="text-cyan-200">{ticker.symbol}</strong>{" "}
            <span className="text-white/80">
              {privacyMode ? "••••" : ticker.displayPrice}
            </span>{" "}
            <span
              className={
                ticker.displayChange.startsWith("+") ? "text-emerald-300" : "text-rose-300"
              }
            >
              {privacyMode ? "•••" : ticker.displayChange}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// [NO-FALLBACK] TickerStrip uses live data only — no demo data allowed (Master red line).
