import {
  BadgeCheck,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { fetchProfileSession, type ProfileSession } from "@/lib/ionApi";
import {
  connectWalletProvider,
  getProbeForKey,
  isEvmProviderKey,
  scanBrowserWallets,
  type LiveWalletConnection,
  type WalletDetectionSnapshot,
  type WalletProviderKey,
} from "@/lib/wallet";

type ProfileHubProps = {
  open: boolean;
  connectedProviderKey: string | null;
  liveConnection: LiveWalletConnection | null;
  selectedAvatarId: string;
  privacyMode: boolean;
  onClose: () => void;
  onConnect: (providerKey: string, live: LiveWalletConnection | null) => void;
  onDisconnect: () => void;
  onAvatarChange: (avatarId: string) => void;
  onPrivacyModeChange: (enabled: boolean) => void;
};

export function ProfileHub({
  open,
  connectedProviderKey,
  liveConnection,
  selectedAvatarId,
  privacyMode,
  onClose,
  onConnect,
  onDisconnect,
  onAvatarChange,
  onPrivacyModeChange,
}: ProfileHubProps) {
  const [session, setSession] = useState<ProfileSession | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [sourceLabel, setSourceLabel] = useState("");
  const [detection, setDetection] = useState<WalletDetectionSnapshot>(() => scanBrowserWallets());
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [walletConnectLink, setWalletConnectLink] = useState<string | null>(null);
  const [walletConnectName, setWalletConnectName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDetection(scanBrowserWallets());
    const interval = window.setInterval(() => {
      setDetection(scanBrowserWallets());
    }, 2500);
    return () => window.clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    setLoadState("loading");
    fetchProfileSession(
      {
        provider: connectedProviderKey,
        address: liveConnection?.address,
        chainId: liveConnection?.chainId,
      },
      controller.signal,
    )
      .then((response) => {
        setSession(response.data);
        setSourceLabel(response.meta.source);
        setLoadState("ready");
        if (!connectedProviderKey) {
          onPrivacyModeChange(response.data.preferences.privacyMode);
        }
      })
      .catch(() => {
        setSession(null);
        setLoadState("error");
      });
    return () => controller.abort();
  }, [open, connectedProviderKey, liveConnection, onPrivacyModeChange]);

  const selectedAvatar = useMemo(
    () =>
      session?.avatar.options.find((option) => option.id === selectedAvatarId) ??
      session?.avatar.options[0],
    [session, selectedAvatarId],
  );

  const ionWallets = useMemo(
    () => session?.wallets.entries.filter((wallet) => wallet.category === "ion-native") ?? [],
    [session],
  );
  const evmWallets = useMemo(
    () => session?.wallets.entries.filter((wallet) => wallet.category === "evm") ?? [],
    [session],
  );

  const handleWalletConnect = useCallback(
    async (key: string) => {
      setConnectError(null);
      setWalletConnectLink(null);
      setWalletConnectName(null);
      const providerKey = key as WalletProviderKey;
      const probe = getProbeForKey(detection, providerKey);

      if (isEvmProviderKey(providerKey)) {
        if (!probe?.detected) {
          setConnectError(probe?.note ?? "Wallet extension not detected in this browser.");
          return;
        }
        setConnectingKey(key);
        const result = await connectWalletProvider(providerKey);
        setConnectingKey(null);
        if (result.ok) {
          onConnect(key, result.connection);
          return;
        }
        if (result.code === "awaiting_wallet" && result.universalLink) {
          setWalletConnectLink(result.universalLink);
          setWalletConnectName(result.walletName ?? "mobile wallet");
          window.open(result.universalLink, "_blank", "noopener,noreferrer");
          return;
        }
        setConnectError(result.message);
        return;
      }

      if (probe?.detected) {
        setConnectingKey(key);
        const result = await connectWalletProvider(providerKey);
        setConnectingKey(null);
        if (result.ok) {
          onConnect(key, result.connection);
          return;
        }
        setConnectError(result.message);
        return;
      }

      onConnect(key, null);
    },
    [detection, onConnect],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="absolute right-0 top-[calc(100%+0.75rem)] z-30 max-h-[min(80vh,44rem)] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.6rem] border border-cyan-200/20 bg-slate-950/95 p-4 shadow-[0_0_42px_rgba(36,247,255,0.28)] backdrop-blur-xl"
      data-testid="profile-hub"
    >
      <span className="sr-only" data-testid="profile-hub-source">
        Profile source: {sourceLabel || "pending"}
      </span>

      {loadState === "loading" ? (
        <p className="py-8 text-center text-sm text-cyan-100/70" data-testid="profile-hub-loading">
          Loading profile hub…
        </p>
      ) : null}

      {loadState === "error" ? (
        <p className="py-8 text-center text-sm text-rose-200" data-testid="profile-hub-error">
          Profile hub unavailable. Check API gateway.
        </p>
      ) : null}

      {session && loadState === "ready" ? (
        <div className="grid gap-4" data-testid="profile-menu">
          <header className="flex items-start gap-3">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-200/30 shadow-neonCyan"
              data-testid="profile-hub-avatar"
              style={{ background: selectedAvatar?.preview ?? session.avatar.options[0]?.preview }}
            >
              <UserRound className="text-white/90" size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/50">Profile Hub</p>
              <p className="mt-1 truncate text-lg font-black text-white" data-testid="profile-display-name">
                {session.identity.displayName}
              </p>
              <p className="mt-1 text-sm text-cyan-200" data-testid="profile-ion-name">
                {session.identity.primaryIonName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-100"
                  data-testid="profile-ion-id"
                >
                  <ShieldCheck size={12} />
                  {session.identity.ionIdStatus === "verified" ? "ION ID verified" : session.identity.ionIdStatus}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-violet-300/25 bg-violet-300/[0.08] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100"
                  data-testid="profile-kyc-pass"
                >
                  <BadgeCheck size={12} />
                  {session.identity.kycPass.badge} {session.identity.kycPass.level}
                </span>
              </div>
            </div>
          </header>

          <section
            className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.06] p-3"
            data-testid="wallet-detect-scan"
          >
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/55">Browser wallet scan</p>
            <p className="mt-1 text-sm text-cyan-50/90">
              {detection.installedCount} injector{detection.installedCount === 1 ? "" : "s"} detected in this browser
            </p>
            <p className="mt-1 text-[10px] text-cyan-100/45">
              Probes follow `.memory-bank/live-data-reference.md` EVM detectors. EVM wallets require an installed
              extension before connect.
            </p>
          </section>

          {connectError ? (
            <p className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-xs text-amber-100" data-testid="wallet-connect-error">
              {connectError}
            </p>
          ) : null}

          <section>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/45">Avatar picker</p>
            <div className="flex gap-2" data-testid="profile-avatar-picker">
              {session.avatar.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border p-2 transition ${
                    selectedAvatarId === option.id
                      ? "border-cyan-200/50 bg-cyan-300/[0.12]"
                      : "border-white/10 bg-white/[0.04] hover:border-cyan-200/30"
                  }`}
                  data-testid={`profile-avatar-option-${option.id}`}
                  onClick={() => onAvatarChange(option.id)}
                >
                  <span
                    className="block h-10 w-10 rounded-xl border border-white/15"
                    style={{ background: option.preview }}
                  />
                  <span className="text-[10px] font-bold text-cyan-100/80">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-cyan-100/50" data-testid="profile-nft-source">
              {session.avatar.nftSource.label}: {session.avatar.nftSource.status}
            </p>
          </section>

          {session.sessionDetection ? (
            <section
              className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3"
              data-testid="profile-session-detection"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100/60">Session detection</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-emerald-200/70" data-testid="profile-detect-source">
                Source: {session.sessionDetection.detectionSource}
              </p>
              <dl className="mt-2 grid gap-1 text-xs text-emerald-50/90">
                <div className="flex justify-between gap-2">
                  <dt className="text-emerald-100/55">Network</dt>
                  <dd data-testid="profile-detect-network">{session.sessionDetection.network}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-emerald-100/55">Provider</dt>
                  <dd data-testid="profile-detect-provider">{session.sessionDetection.walletProvider}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-emerald-100/55">Address</dt>
                  <dd data-testid="profile-detect-address">{session.sessionDetection.addressPreview}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-emerald-100/55">Format</dt>
                  <dd>{session.sessionDetection.addressFormat}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-emerald-100/55">Identity</dt>
                  <dd data-testid="profile-detect-identity">{session.sessionDetection.identityStatus}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] font-bold text-emerald-100" data-testid="wallet-confirmation">
                {session.sessionDetection.walletProvider} secure session ready
              </p>
            </section>
          ) : null}

          {walletConnectLink ? (
            <section
              className="rounded-2xl border border-violet-300/25 bg-violet-400/[0.08] p-3"
              data-testid="walletconnect-awaiting"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-100/70">
                TonConnect · awaiting {walletConnectName}
              </p>
              <p className="mt-1 text-[11px] text-violet-50/80">
                Approve the connection in your wallet app, then return here. Session updates automatically.
              </p>
              <a
                className="mt-2 block break-all text-xs font-bold text-cyan-200 underline"
                href={walletConnectLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open wallet link
              </a>
            </section>
          ) : null}

          <section data-testid="profile-wallets">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/45">Wallets</p>
            <WalletGroup
              connectedKey={connectedProviderKey}
              connectingKey={connectingKey}
              detection={detection}
              label="ION native"
              onConnect={handleWalletConnect}
              wallets={ionWallets}
            />
            <WalletGroup
              connectedKey={connectedProviderKey}
              connectingKey={connectingKey}
              detection={detection}
              label="EVM detectors"
              onConnect={handleWalletConnect}
              wallets={evmWallets}
            />
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3" data-testid="profile-domains">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/45">.ion domains</p>
            <p className="mt-1 text-sm font-bold text-white">{session.domains.primaryName}</p>
            <ul className="mt-2 space-y-1 text-xs text-cyan-100/65">
              {session.domains.records.map((record) => (
                <li key={`${record.type}-${record.value}`}>
                  <span className="font-bold text-cyan-200">{record.type}</span> · {record.value}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-2" data-testid="profile-preferences">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/45">Preferences</p>
            <PreferenceRow icon={<Globe2 size={16} />} label="Language" value={session.preferences.language} />
            <PreferenceRow icon={<Palette size={16} />} label="Theme" value={session.preferences.theme} />
            <PreferenceRow icon={<Sparkles size={16} />} label="Animation" value={session.preferences.animation} />
            <button
              type="button"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-left transition hover:border-cyan-200/30"
              data-testid="profile-privacy-toggle"
              onClick={() => onPrivacyModeChange(!privacyMode)}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                {privacyMode ? (
                  <EyeOff size={16} className="text-amber-200" />
                ) : (
                  <Eye size={16} className="text-cyan-200" />
                )}
                Privacy mode
              </span>
              <span className="text-xs text-cyan-100/60">{privacyMode ? "Balances hidden" : "Balances visible"}</span>
            </button>
          </section>

          <section data-testid="profile-quick-actions">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/45">Quick access</p>
            <div className="grid gap-1">
              {session.quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left transition hover:border-cyan-200/25 hover:bg-cyan-300/[0.06]"
                  data-testid={`profile-action-${action.key}`}
                >
                  <span>
                    <span className="block text-sm font-bold text-white">{action.label}</span>
                    <span className="block text-[11px] text-cyan-100/55">{action.description}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-black text-cyan-200">
                    {action.count ?? <Bell size={12} />}
                    <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <NeonButton
            className="w-full justify-center"
            data-testid="profile-open-full"
            onClick={onClose}
            type="button"
          >
            Open full Profile
          </NeonButton>

          {connectedProviderKey ? (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/[0.08] px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-300/[0.14]"
              data-testid="wallet-disconnect"
              onClick={onDisconnect}
              type="button"
            >
              <LogOut size={16} />
              Disconnect wallet
            </button>
          ) : null}

          <p className="text-[10px] leading-relaxed text-cyan-100/40">{session.provenance.description}</p>
        </div>
      ) : null}
    </div>
  );
}

function WalletGroup({
  label,
  wallets,
  connectedKey,
  connectingKey,
  detection,
  onConnect,
}: {
  label: string;
  wallets: ProfileSession["wallets"]["entries"];
  connectedKey: string | null;
  connectingKey: string | null;
  detection: WalletDetectionSnapshot;
  onConnect: (key: string) => void;
}) {
  return (
    <div className="mb-2">
      <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-slate-300/70">{label}</p>
      <div className="grid gap-1">
        {wallets.map((wallet) => {
          const probe = getProbeForKey(detection, wallet.key as WalletProviderKey);
          const detected = probe?.detected ?? false;
          const isConnecting = connectingKey === wallet.key;
          const evmBlocked = isEvmProviderKey(wallet.key as WalletProviderKey) && !detected;

          return (
            <button
              key={wallet.key}
              type="button"
              className={`rounded-2xl border p-2 text-left transition ${
                connectedKey === wallet.key
                  ? "border-emerald-300/35 bg-emerald-300/[0.1]"
                  : evmBlocked
                    ? "border-white/10 bg-white/[0.02] opacity-80"
                    : "border-white/10 bg-white/[0.04] hover:border-cyan-200/30"
              }`}
              data-testid={`wallet-provider-${wallet.key}`}
              data-detected={detected ? "true" : "false"}
              disabled={wallet.status === "planned" || isConnecting}
              onClick={() => onConnect(wallet.key)}
            >
              <span className="flex items-center gap-2">
                <Wallet size={14} className="text-cyan-200" />
                <span className="text-sm font-bold text-white">{wallet.name}</span>
                <span
                  className={`ml-auto text-[10px] font-black uppercase ${
                    detected ? "text-emerald-200" : "text-slate-400"
                  }`}
                  data-testid={`wallet-detected-${wallet.key}`}
                >
                  {wallet.status === "planned"
                    ? "Planned"
                    : detected
                      ? "Installed"
                      : "Not detected"}
                </span>
              </span>
              <span className="mt-1 block text-[11px] text-cyan-100/55">{wallet.label}</span>
              <span className="mt-1 block font-mono text-[10px] text-slate-400/80">{wallet.detector}</span>
              {isConnecting ? (
                <span className="mt-1 block text-[10px] font-bold text-cyan-200">Requesting wallet approval…</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-bold text-white">
        {icon}
        {label}
      </span>
      <span className="text-xs text-cyan-100/65">{value}</span>
    </div>
  );
}
