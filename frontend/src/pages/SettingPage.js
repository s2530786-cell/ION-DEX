import React, { useState, useEffect } from "react";
import { Panel, NeonButton, PageHeader, Icon } from "../components/kit";
import { api } from "../lib/api";
import { useWallet } from "../context/WalletContext";
import { toast } from "sonner";

const GAS_MODES = ["slow", "standard", "fast"];
const ORACLES = [
  { id: "dual", name: "Dual Source (Chainlink + TWAP)" },
  { id: "chainlink", name: "Chainlink Only" },
  { id: "twap", name: "PancakeSwap TWAP" },
];

export default function SettingPage() {
  const { address } = useWallet();
  const [s, setS] = useState({ slippage: 0.5, gas_mode: "standard", oracle: "dual", multisig_threshold: 3 });

  useEffect(() => { if (address) api.getSettings(address).then(setS); }, [address]);

  const save = async () => {
    if (!address) { toast.error("Connect wallet first"); return; }
    await api.saveSettings({ address, ...s });
    toast.success("Settings saved");
  };

  const Row = ({ label, children }) => (
    <div className="flex justify-between items-center py-4" style={{ borderBottom: "1px solid rgba(248,251,255,0.05)" }}>
      <span style={{ color: "var(--text-dim)" }}>{label}</span>{children}
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure slippage, gas, oracle and multisig parameters." />
      <Panel className="p-7" style={{ maxWidth: 640 }}>
        <div className="flex items-center gap-2 mb-4"><Icon name="settings.svg" size={24} /><h3 className="h1" style={{ fontSize: 17 }}>Trading & Security</h3></div>

        <Row label="Slippage Tolerance">
          <div className="flex gap-2">
            {[0.1, 0.5, 1.0].map((v) => (
              <button key={v} onClick={() => setS({ ...s, slippage: v })} className="chip" style={{ color: s.slippage === v ? "var(--cyan)" : "var(--text-dim)" }} data-testid={`slippage-${v}`}>{v}%</button>
            ))}
          </div>
        </Row>

        <Row label="Gas Priority">
          <div className="flex gap-2">
            {GAS_MODES.map((g) => (
              <button key={g} onClick={() => setS({ ...s, gas_mode: g })} className="chip" style={{ color: s.gas_mode === g ? "var(--cyan)" : "var(--text-dim)", textTransform: "capitalize" }} data-testid={`gas-${g}`}>{g}</button>
            ))}
          </div>
        </Row>

        <Row label="Oracle Source">
          <select value={s.oracle} onChange={(e) => setS({ ...s, oracle: e.target.value })} className="ghost-btn" style={{ height: 40 }} data-testid="oracle-select">
            {ORACLES.map((o) => <option key={o.id} value={o.id} style={{ background: "#0a0a18" }}>{o.name}</option>)}
          </select>
        </Row>

        <Row label="Multisig Threshold (of 5)">
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button key={n} onClick={() => setS({ ...s, multisig_threshold: n })} className="chip" style={{ color: s.multisig_threshold === n ? "var(--cyan)" : "var(--text-dim)" }} data-testid={`multisig-${n}`}>{n}/5</button>
            ))}
          </div>
        </Row>

        <div className="mt-3" style={{ fontSize: 12, color: "var(--text-dim)" }}>Vault timelock: 48h · Master fee: 25% · Fees collected in ION only.</div>
        <NeonButton className="mt-6" onClick={save} data-testid="save-settings">Save Settings</NeonButton>
      </Panel>
    </div>
  );
}
