import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const THEMES = [
  { id: "deepspace", name: "Deep Space", swatch: ["#00F5FF", "#9D4EDD", "#FF007A"] },
  { id: "aurora", name: "Aurora", swatch: ["#00ff88", "#00ffff", "#6020ff"] },
  { id: "nebula", name: "Sunset Nebula", swatch: ["#ff00ff", "#ffd166", "#ff4466"] },
  { id: "quantum", name: "Quantum Violet", swatch: ["#a020ff", "#6020ff", "#00ffff"] },
  { id: "emerald", name: "Emerald Matrix", swatch: ["#00ff88", "#00ffaa", "#00ffff"] },
  { id: "solar", name: "Solar Gold", swatch: ["#ffd166", "#ff9f1c", "#ff00ff"] },
];

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const ROTATE_MS = 30 * 60 * 1000; // 30 minutes

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("ion-theme") || "deepspace");
  const [bg, setBg] = useState(() => localStorage.getItem("ion-bg") || "scenery");
  const [autoBg, setAutoBg] = useState(() => localStorage.getItem("ion-autobg") !== "false");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ion-theme", theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem("ion-bg", bg); }, [bg]);
  useEffect(() => { localStorage.setItem("ion-autobg", String(autoBg)); }, [autoBg]);

  // Auto-rotate background every 30 minutes
  useEffect(() => {
    if (!autoBg) return;
    const t = setInterval(() => setBg((b) => (b === "scenery" ? "aurora" : "scenery")), ROTATE_MS);
    return () => clearInterval(t);
  }, [autoBg]);

  const pickBg = useCallback((mode) => { setBg(mode); setAutoBg(false); }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bg, setBg: pickBg, autoBg, setAutoBg }}>
      {children}
    </ThemeContext.Provider>
  );
}
