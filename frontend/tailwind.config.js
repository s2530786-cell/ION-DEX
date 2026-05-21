/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          primary: "#00ffff",
          secondary: "#ff00ff",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
        },
        ion: {
          cyan: "#24f7ff",
          blue: "#2563ff",
          violet: "#8d4dff",
          magenta: "#ff3bd4",
          gold: "#ffd166",
          ink: "#061024",
        },
      },
      backgroundImage: {
        "neon-border": "linear-gradient(135deg, #00ffff, #ff00ff)",
      },
      boxShadow: {
        neonCyan: "0 0 28px rgba(36, 247, 255, 0.45)",
        neonMagenta: "0 0 28px rgba(255, 59, 212, 0.38)",
        neonGold: "0 0 28px rgba(255, 209, 102, 0.35)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
