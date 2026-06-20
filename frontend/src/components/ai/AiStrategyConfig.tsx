import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { type AiStrategyCreateInput, type AiStrategyType } from "@/lib/ionApi";
import { DesignTokens as dt } from "@/lib/design-tokens";

type StrategyConfig = AiStrategyCreateInput["params"] & {
  name: string;
  type: AiStrategyType;
};

type Props = {
  onSubmit: (config: StrategyConfig) => void;
  initial?: Partial<StrategyConfig>;
};

const strategyTypeLabels: Record<AiStrategyType, string> = {
  grid: "Grid Trading",
  trend: "Trend Following",
  arbitrage: "Arbitrage",
  market_making: "Market Making",
};

export default function AiStrategyConfig({ onSubmit, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AiStrategyType>(initial?.type ?? "grid");
  const [fundAmount, setFundAmount] = useState(initial?.fundAmount?.toString() ?? "");
  const [stopLoss, setStopLoss] = useState(initial?.stopLoss?.toString() ?? "");
  const [takeProfit, setTakeProfit] = useState(initial?.takeProfit?.toString() ?? "");
  const [maxSlippage, setMaxSlippage] = useState(initial?.maxSlippage?.toString() ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const nextErrors: string[] = [];
    const amount = Number(fundAmount);
    const loss = Number(stopLoss);
    const profit = Number(takeProfit);
    const slippage = Number(maxSlippage);

    if (!name.trim()) nextErrors.push("Strategy name is required");
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.push("Fund amount must be positive");
    if (!Number.isFinite(loss) || loss <= 0) nextErrors.push("Stop loss must be positive");
    if (!Number.isFinite(profit) || profit <= 0) nextErrors.push("Take profit must be positive");
    if (Number.isFinite(loss) && Number.isFinite(profit) && loss >= profit) nextErrors.push("Stop loss must be less than take profit");
    if (!Number.isFinite(slippage) || slippage <= 0) nextErrors.push("Max slippage must be positive");

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      type,
      fundAmount: Number(fundAmount),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      maxSlippage: Number(maxSlippage),
    });
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: `${dt.spacing.sm} ${dt.spacing.md}`,
    borderRadius: dt.borderRadius.md,
    border: dt.borders.input,
    background: dt.colors.inputBg,
    color: dt.colors.textPrimary,
    fontSize: dt.typography.body.fontSize,
    outline: "none",
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3
        style={{
          color: dt.colors.textPrimary,
          fontSize: dt.typography.subheading.fontSize,
          marginBottom: dt.spacing.cardPadding,
          fontWeight: dt.typography.subheading.fontWeight,
        }}
      >
        Configure Strategy
      </h3>

      {errors.length > 0 ? (
        <div
          style={{
            background: dt.colors.errorBg,
            border: `1px solid ${dt.colors.errorBorder}`,
            borderRadius: dt.borderRadius.md,
            padding: dt.spacing.sm,
            marginBottom: dt.spacing.md,
          }}
        >
          {errors.map((error) => (
            <div key={error} style={{ color: dt.colors.negative, fontSize: dt.typography.caption.fontSize }}>
              {error}
            </div>
          ))}
        </div>
      ) : null}

      <Field label="Strategy Name">
        <input aria-label="Strategy name, for example ION Grid Bot" onChange={(event) => setName(event.target.value)} style={inputStyle} value={name} />
      </Field>

      <Field label="Strategy Type">
        <select onChange={(event) => setType(event.target.value as AiStrategyType)} style={{ ...inputStyle, cursor: "pointer" }} value={type}>
          {Object.entries(strategyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <div style={{ display: "grid", gap: dt.spacing.md, gridTemplateColumns: dt.layout.twoColumns }}>
        <Field label="Fund Amount (USDT)">
          <input aria-label="Fund amount in USDT" min="0" onChange={(event) => setFundAmount(event.target.value)} step="1" style={inputStyle} type="number" value={fundAmount} />
        </Field>
        <Field label="Max Slippage (%)">
          <input aria-label="Maximum slippage percent" min="0" onChange={(event) => setMaxSlippage(event.target.value)} step="0.1" style={inputStyle} type="number" value={maxSlippage} />
        </Field>
        <Field label="Stop Loss (%)">
          <input aria-label="Stop loss percent" min="0" onChange={(event) => setStopLoss(event.target.value)} step="0.1" style={inputStyle} type="number" value={stopLoss} />
        </Field>
        <Field label="Take Profit (%)">
          <input aria-label="Take profit percent" min="0" onChange={(event) => setTakeProfit(event.target.value)} step="0.1" style={inputStyle} type="number" value={takeProfit} />
        </Field>
      </div>

      <button
        style={{
          width: "100%",
          padding: `${dt.spacing.sm} ${dt.spacing.xl}`,
          borderRadius: dt.borderRadius.button,
          border: "none",
          background: dt.gradients.buttonPrimary,
          color: dt.colors.background,
          fontSize: dt.typography.body.fontSize,
          fontWeight: dt.typography.buttonLabel.fontWeight,
          cursor: "pointer",
          marginTop: dt.spacing.lg,
        }}
        type="submit"
      >
        Create Strategy
      </button>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div style={{ marginBottom: dt.spacing.md }}>
      <label style={{ color: dt.colors.textSecondary, display: "block", fontSize: dt.typography.caption.fontSize, marginBottom: dt.spacing.xs }}>{label}</label>
      {children}
    </div>
  );
}
