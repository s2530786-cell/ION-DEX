import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Bell, Moon, Percent, Trash2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { NeonButton } from "@/components/ui/NeonButton";
import {
  applyAppSettingsToDocument,
  clearAppLocalCache,
  loadAppSettings,
  parseSlippagePct,
  saveAppSettings,
  type AppSettings,
} from "@/lib/appSettings";

function SettingToggle({
  enabled,
  onToggle,
  testId,
  tone = "cyan",
}: {
  enabled: boolean;
  onToggle: () => void;
  testId: string;
  tone?: "cyan" | "purple";
}) {
  const trackClass =
    tone === "purple"
      ? enabled
        ? "bg-fuchsia-500/40 border-fuchsia-300/40"
        : "bg-white/10 border-white/15"
      : enabled
        ? "bg-cyan-400/35 border-cyan-200/40"
        : "bg-white/10 border-white/15";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      data-testid={testId}
      className={`relative h-7 w-12 rounded-full border transition ${trackClass}`}
      onClick={onToggle}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          enabled ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <motion.div
        className="min-w-0 flex-1"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs text-cyan-100/55">{description}</p>
      </motion.div>
      <motion.div
        className="shrink-0"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: 0.04 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function SettingPage() {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [editingSlippage, setEditingSlippage] = useState(false);
  const [slippageDraft, setSlippageDraft] = useState(settings.defaultSlippagePct);
  const [message, setMessage] = useState<string | null>(null);

  const slippageValid = useMemo(() => parseSlippagePct(slippageDraft) !== null, [slippageDraft]);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    saveAppSettings(next);
    applyAppSettingsToDocument(next);
  }, []);

  useEffect(() => {
    applyAppSettingsToDocument(settings);
  }, [settings]);

  const toggleDarkMode = useCallback(() => {
    persist({ ...settings, darkMode: !settings.darkMode });
    setMessage(settings.darkMode ? "Light contrast profile applied locally." : "Cyber dark mode enabled.");
  }, [persist, settings]);

  const toggleNotifications = useCallback(() => {
    persist({ ...settings, pushNotifications: !settings.pushNotifications });
    setMessage(
      settings.pushNotifications
        ? "Trade and burn alerts paused for this browser."
        : "Push notifications enabled for this browser.",
    );
  }, [persist, settings]);

  const saveSlippage = useCallback(() => {
    if (!slippageValid) {
      return;
    }
    persist({ ...settings, defaultSlippagePct: slippageDraft.trim() });
    setEditingSlippage(false);
    setMessage(`Default slippage saved at ${slippageDraft.trim()}%.`);
  }, [persist, settings, slippageDraft, slippageValid]);

  const handleClearCache = useCallback(() => {
    const removed = clearAppLocalCache();
    setMessage(removed > 0 ? `Cleared ${removed} cached entries.` : "No removable cache entries found.");
  }, []);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 py-4 sm:px-4"
      data-testid="page-settings"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <header className="space-y-2" data-testid="settings-hero">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200/55">Preferences</p>
        <h1 className="text-2xl font-black text-white sm:text-3xl" data-testid="page-title">
          System settings
        </h1>
        <p className="max-w-2xl text-sm text-cyan-100/65">
          Dark mode, default slippage, notification switches, and local cache controls — stored in this browser only.
        </p>
      </header>

      {message ? (
        <p
          className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-50"
          data-testid="settings-saved-banner"
        >
          {message}
        </p>
      ) : null}

      <GlassPanel className="p-4 sm:p-6">
        <SettingRow
          title="Dark interface mode"
          description="Keeps the OKX Web3 cyber dark palette active across trading surfaces."
        >
          <SettingToggle enabled={settings.darkMode} onToggle={toggleDarkMode} testId="settings-dark-toggle" />
        </SettingRow>

        <SettingRow
          title="Trade slippage default"
          description={`Current default ${settings.defaultSlippagePct}% · applies to new swap and desk forms.`}
        >
          {editingSlippage ? (
            <motion.div className="flex flex-wrap items-center gap-2">
              <input
                className="w-24 rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1 text-sm text-white"
                data-testid="settings-slippage-input"
                inputMode="decimal"
                onChange={(event) => setSlippageDraft(event.target.value)}
                value={slippageDraft}
              />
              <NeonButton
                className="px-3 py-1.5 text-xs"
                data-testid="settings-slippage-save"
                disabled={!slippageValid}
                onClick={saveSlippage}
                type="button"
              >
                Save
              </NeonButton>
              <button
                type="button"
                className="text-xs text-cyan-100/60 underline"
                onClick={() => {
                  setEditingSlippage(false);
                  setSlippageDraft(settings.defaultSlippagePct);
                }}
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-cyan-100" data-testid="settings-slippage-value">
                {settings.defaultSlippagePct}%
              </span>
              <button
                type="button"
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-50 transition hover:border-cyan-200/35"
                data-testid="settings-slippage-edit"
                onClick={() => {
                  setSlippageDraft(settings.defaultSlippagePct);
                  setEditingSlippage(true);
                }}
              >
                Edit
              </button>
            </div>
          )}
        </SettingRow>

        <SettingRow
          title="Push notifications"
          description="Trade fills, bridge status, and burn anomaly alerts for this browser session."
        >
          <SettingToggle
            enabled={settings.pushNotifications}
            onToggle={toggleNotifications}
            testId="settings-notify-toggle"
            tone="purple"
          />
        </SettingRow>

        <SettingRow
          title="Clear local cache"
          description="Removes cached panels and unsaved form snapshots. Wallet sessions stay connected."
        >
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-red-500/25"
            data-testid="settings-clear-cache"
            onClick={handleClearCache}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </SettingRow>
      </GlassPanel>

      <GlassPanel className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
        <motion.div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Moon className="mt-0.5 text-cyan-200" size={16} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-100/70">Theme</p>
            <p className="text-sm text-white" data-testid="settings-summary-theme">
              {settings.darkMode ? "Cyber dark" : "Reduced glow"}
            </p>
          </div>
        </motion.div>
        <motion.div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Percent className="mt-0.5 text-fuchsia-200" size={16} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-100/70">Slippage</p>
            <p className="text-sm text-white">{settings.defaultSlippagePct}% default</p>
          </div>
        </motion.div>
        <motion.div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Bell className="mt-0.5 text-violet-200" size={16} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-100/70">Alerts</p>
            <p className="text-sm text-white" data-testid="settings-summary-notify">
              {settings.pushNotifications ? "Enabled" : "Muted"}
            </p>
          </div>
        </motion.div>
      </GlassPanel>
    </motion.div>
  );
}
