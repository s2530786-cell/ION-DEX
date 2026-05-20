/** @type {import('tailwindcss').Config} */
export default {
  // Vite 项目无 src/app；./src/**/* 已覆盖 components/pages，下列路径为显式扫描
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1440px',
      },
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
