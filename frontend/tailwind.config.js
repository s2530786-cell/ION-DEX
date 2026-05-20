/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ion: {
          primary: "#00ffff",
          secondary: "#ff00ff",
          "glass-bg": "rgba(0, 0, 0, 0.4)",
          "glass-surface": "rgba(255, 255, 255, 0.05)",
          cyan: "#24f7ff",
          blue: "#2563ff",
          violet: "#8d4dff",
          magenta: "#ff3bd4",
          gold: "#ffd166",
          ink: "#061024",
        },
      },
      backgroundImage: {
        "ion-border-gradient": "linear-gradient(135deg, #00ffff, #ff00ff)",
      },
      backdropBlur: {
        glass: "16px",
      },
      boxShadow: {
        neonCyan: "var(--ion-shadow-neon-cyan)",
        neonMagenta: "var(--ion-shadow-neon-magenta)",
        neonGlass: "var(--ion-shadow-neon-glass)",
        neonGold: "0 0 28px rgba(255, 209, 102, 0.35)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
