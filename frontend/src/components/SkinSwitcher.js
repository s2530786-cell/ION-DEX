import React, { useState } from "react";
import { useTheme, THEMES } from "../context/ThemeContext";
import { Icon } from "./kit";

export default function SkinSwitcher() {
  const { theme, setTheme, bg, setBg, autoBg, setAutoBg } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen(!open)} className="ghost-btn" style={{ width: 44, height: 44, padding: 0 }} data-testid="skin-switcher-btn" title="Skins & Background">
        <Icon name="settings.svg" size={20} />
      </button>
      {open && (
        <div className="panel p-4 absolute mt-3" style={{ right: 0, width: 272, zIndex: 60 }} data-testid="skin-panel">
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10, fontWeight: 600 }}>SKIN</div>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} data-testid={`skin-${t.id}`}
                className="panel-hover" style={{ padding: 8, borderRadius: 12, border: theme === t.id ? "1px solid var(--cyan)" : "1px solid var(--panel-border)", background: theme === t.id ? "rgba(0,255,255,0.06)" : "transparent" }}>
                <div style={{ height: 26, borderRadius: 8, background: `linear-gradient(90deg, ${t.swatch[0]}, ${t.swatch[1]}, ${t.swatch[2]})`, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: theme === t.id ? "var(--text)" : "var(--text-dim)" }}>{t.name}</div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10, fontWeight: 600 }}>BACKGROUND</div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setBg("scenery")} className="ghost-btn flex-1" style={{ height: 40, borderColor: !autoBg && bg === "scenery" ? "var(--cyan)" : undefined }} data-testid="bg-galaxy">🌍 Scenery</button>
            <button onClick={() => setBg("aurora")} className="ghost-btn flex-1" style={{ height: 40, borderColor: !autoBg && bg === "aurora" ? "var(--cyan)" : undefined }} data-testid="bg-aurora">🌌 Aurora</button>
          </div>
          <button onClick={() => setAutoBg(!autoBg)} className="ghost-btn w-full" style={{ height: 40, borderColor: autoBg ? "var(--cyan)" : undefined, color: autoBg ? "var(--cyan)" : "var(--text-dim)" }} data-testid="bg-auto">
            Auto-rotate {autoBg ? "ON" : "OFF"} · 30min
          </button>
        </div>
      )}
    </div>
  );
}
