/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ion: {
          cyan: "#24f7ff",
          blue: "#2563ff",
          violet: "#8d4dff",
          magenta: "#ff3bd4",
          gold: "#ffd166",
          green: "#00ff88",
          pink: "#ff0088",
          ink: "#061024",
        },
      },
      boxShadow: {
        neonCyan: "0 0 28px rgba(36, 247, 255, 0.45)",
        neonMagenta: "0 0 28px rgba(255, 59, 212, 0.38)",
        neonGold: "0 0 28px rgba(255, 209, 102, 0.35)",
        neonViolet: "0 0 28px rgba(141, 77, 255, 0.35)",
        neonGreen: "0 0 28px rgba(0, 255, 136, 0.35)",
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
      }
    },
  },
  plugins: [],
};
