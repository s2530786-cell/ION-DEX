/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ion: {
          cyan: "#00ffff",
          purple: "#6020ff",
          violet: "#6020ff",
          magenta: "#ff00ff",
          gold: "#ffd166",
          green: "#00ff88",
          pink: "#ff0088",
          ink: "#010104",
          elevated: "#06060f",
        },
      },
      boxShadow: {
        neonCyan: "0 0 28px rgba(0, 255, 255, 0.55)",
        neonMagenta: "0 0 28px rgba(255, 0, 255, 0.48)",
        neonGold: "0 0 28px rgba(255, 209, 102, 0.35)",
        neonViolet: "0 0 28px rgba(96, 32, 255, 0.45)",
        neonPurple: "0 0 28px rgba(96, 32, 255, 0.45)",
        neonGreen: "0 0 28px rgba(0, 255, 136, 0.35)",
        cyberPanel: "0 0 24px rgba(0, 255, 255, 0.35), 0 0 48px rgba(96, 32, 255, 0.22), 0 0 72px rgba(255, 0, 255, 0.14)",
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        'ion-spin-slow': 'ionSpinSlow 4s linear infinite',
        'ion-pulse-slow': 'ionPulseSlow 4s ease-in-out infinite',
        'ion-float-3d': 'ionFloat3d 9s ease-in-out infinite',
        'ion-shimmer': 'ionShimmer 2.5s ease-in-out infinite',
        'ion-scale': 'ionScale 1.5s ease-in-out infinite',
        scanline: 'ionScanlineDrift 8s linear infinite',
        'border-pulse': 'ionNeonPulse 3.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
