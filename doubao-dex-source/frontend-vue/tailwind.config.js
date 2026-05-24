/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ion: {
          dark: '#0a0a12',
          cyan: '#00ffff',
          purple: '#ff00ff',
          green: '#00ff88',
          pink: '#ff0088',
        }
      },
      animation: {
        flowBorder: 'gradientFlow 3s ease infinite',
        auroraMove: 'auroraFloat 8s ease-in-out infinite alternate',
        hoverUp: 'hoverLift 0.3s ease forwards',
      },
      keyframes: {
        gradientFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        auroraFloat: {
          '0%': { transform: 'translateY(0) scale(1.1)' },
          '100%': { transform: 'translateY(-20px) scale(1)' }
        },
        hoverLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' }
        }
      }
    },
  },
  plugins: [],
}
