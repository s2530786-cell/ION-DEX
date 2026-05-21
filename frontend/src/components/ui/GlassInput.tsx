import React from "react";

/**
 * 5-Layer Glass Input — form field with neon focus glow
 *
 * Layers (bottom → top):
 * 1. Outer glow — STRONGER, visible even unfocused
 * 2. Glass base — DEEPER blur + dark translucent
 * 3. Mid glass — lighter refraction
 * 4. Glossy sweep — diagonal highlight
 * 5. Inner border — bright edge, INTENSIFIES on focus
 * 6. Content — input element
 */

interface GlassInputProps {
  label: string;
  testId?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "number" | "text";
  className?: string;
}

const COLORS = {
  primary: "rgba(36, 247, 255, 1)",
  secondary: "rgba(36, 247, 255, 0.55)",
  glow: "rgba(36, 247, 255, 0.45)",
};

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  testId,
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <label
      className={`relative block rounded-[1rem] transition-all duration-300 ${className}`}
      style={{ isolation: "isolate" }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {/* L1: Outer glow — visible even idle, STRONGER on focus */}
      <div
        className="absolute -inset-[3px] rounded-[1.15rem] pointer-events-none transition-all duration-300"
        style={{
          background: `conic-gradient(from 200deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.primary})`,
          opacity: focused ? 0.4 : 0.15,
          filter: focused ? "blur(8px)" : "blur(10px)",
        }}
      />

      {/* L1b: Extra bloom on focus */}
      <div
        className="absolute -inset-[5px] rounded-[1.25rem] pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${COLORS.glow}, transparent 70%)`,
          opacity: focused ? 0.15 : 0,
          filter: "blur(14px)",
        }}
      />

      {/* L2: Glass base — DARKER, STRONGER blur */}
      <div
        className="absolute inset-0 rounded-[1rem] overflow-hidden pointer-events-none transition-all duration-300"
        style={{
          background: "rgba(3,5,15,0.65)",
          backdropFilter: "blur(20px) saturate(1.5)",
          WebkitBackdropFilter: "blur(20px) saturate(1.5)",
          border: `1.5px solid ${COLORS.primary.replace("1)", focused ? "0.45)" : "0.18)")}`,
          boxShadow: focused
            ? `inset 0 0 30px ${COLORS.glow.replace("0.45", "0.12")}`
            : `inset 0 0 12px ${COLORS.glow.replace("0.45", "0.04")}`,
        }}
      />

      {/* L3: Mid glass */}
      <div
        className="absolute inset-[1px] rounded-[0.94rem] overflow-hidden pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 30%, transparent 60%)",
          backdropFilter: "blur(12px) saturate(1.3)",
          WebkitBackdropFilter: "blur(12px) saturate(1.3)",
        }}
      />

      {/* L4: Glossy sweep — MOVES on focus */}
      <div className="absolute inset-[1px] rounded-[0.94rem] overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            background: focused
              ? "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.06) 55%, transparent 70%)"
              : "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.03) 55%, transparent 65%)",
          }}
        />
      </div>

      {/* L5: Inner border */}
      <div
        className="absolute inset-[2px] rounded-[0.92rem] pointer-events-none transition-all duration-300"
        style={{
          border: `1px solid ${COLORS.primary.replace("1)", focused ? "0.30)" : "0.12)")}`,
        }}
      />

      {/* L6: Content */}
      <div className="relative z-10 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
          {label}
        </span>
        <input
          className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none placeholder:text-cyan-100/25 transition-shadow duration-300"
          data-testid={testId}
          inputMode={type === "number" ? "decimal" : undefined}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            textShadow: focused ? "0 0 12px rgba(36,247,255,0.3)" : undefined,
          }}
          type={type}
          value={value}
        />
      </div>
    </label>
  );
};
