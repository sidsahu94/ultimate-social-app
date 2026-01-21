/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Outfit"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        // The "Void" Dark Theme
        bg: {
          light: "#F0F2F5",     // Clean porcelain
          dark: "#050505",      // True OLED Black
          card: "#121212",      // Slightly lighter black
        },
        primary: {
          DEFAULT: "#3B82F6",   // Electric Blue
          500: "#3B82F6",
          600: "#2563EB",
          glow: "rgba(59, 130, 246, 0.5)",
        },
        secondary: {
          DEFAULT: "#8B5CF6",   // Violet
          glow: "rgba(139, 92, 246, 0.5)",
        },
        accent: {
          pink: "#EC4899",
          cyan: "#06B6D4",
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'glass-shine': 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'nav-float': '0 10px 40px -10px rgba(0,0,0,0.5)',
        // Neumorphic shadows
        'neu-light': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-dark': '5px 5px 10px #0a0a0a, -5px -5px 10px #1a1a1a',
        'neu-inset-light': 'inset 6px 6px 10px 0 rgba(163, 177, 198, 0.7), inset -6px -6px 10px 0 rgba(255, 255, 255, 0.8)',
        'neu-inset-dark': 'inset 5px 5px 10px #0b0b0b, inset -5px -5px 10px #1e1e1e',
        'neon-blue': '0 0 5px #03e9f4, 0 0 25px #03e9f4, 0 0 50px #03e9f4, 0 0 100px #03e9f4',
        'neon-pink': '0 0 5px #ff00de, 0 0 25px #ff00de, 0 0 50px #ff00de, 0 0 100px #ff00de',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'heart-beat': 'heartBeat 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        heartBeat: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};