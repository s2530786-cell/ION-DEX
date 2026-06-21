import React from "react";

export const Panel = ({ children, className = "", hover = false, ...p }) => (
  <div className={`panel ${hover ? "panel-hover" : ""} ${className}`} {...p}>{children}</div>
);

export const SectionTitle = ({ children, icon, right }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon && <Icon name={icon} size={22} />}
      <h2 className="h1" style={{ fontSize: 18 }}>{children}</h2>
    </div>
    {right}
  </div>
);

export const NeonButton = ({ children, className = "", ...p }) => (
  <button className={`neon-btn w-full ${className}`} {...p}>{children}</button>
);

export const GhostButton = ({ children, className = "", ...p }) => (
  <button className={`ghost-btn ${className}`} {...p}>{children}</button>
);

export const NeonInput = ({ className = "", ...p }) => (
  <input className={`neon-input ${className}`} {...p} />
);

export const Icon = ({ name, size = 24, alt = "", className = "" }) => (
  <img
    src={`/assets/icons/${name}`}
    width={size}
    height={size}
    alt={alt || name}
    className={className}
    style={{ display: "inline-block", objectFit: "contain" }}
    onError={(e) => { e.currentTarget.style.opacity = 0.25; }}
  />
);

export const StatValue = ({ value, label, size = 28, color = "var(--text)", aurora = false }) => (
  <div>
    {label && <div style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 4 }}>{label}</div>}
    <div className={`stat-mono ${aurora ? "aurora-text" : ""}`} style={{ fontSize: size, color: aurora ? undefined : color }}>{value}</div>
  </div>
);

export const Badge = ({ children, color = "var(--cyan)" }) => (
  <span className="chip" style={{ color, borderColor: `${color}55` }}>{children}</span>
);

export const Loader = ({ label = "Loading" }) => (
  <div className="flex items-center justify-center py-10" style={{ color: "var(--text-dim)" }}>
    <span className="pulse-glow">{label}...</span>
  </div>
);

export const PageHeader = ({ title, subtitle, right }) => (
  <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
    <div>
      <h1 className="h1 aurora-text" style={{ fontSize: 28 }}>{title}</h1>
      {subtitle && <p style={{ color: "var(--text-dim)", marginTop: 6 }}>{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const Risk = ({ level }) => {
  const map = { Low: "var(--green)", Medium: "var(--gold)", High: "var(--red)", low: "var(--green)", medium: "var(--gold)", high: "var(--red)" };
  return <Badge color={map[level] || "var(--cyan)"}>{level}</Badge>;
};
