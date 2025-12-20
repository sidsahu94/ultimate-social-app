/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 🎨 THE TRICK: Remapping 'indigo' to a vibrant "Electric Violet" palette
        // This instantly changes every primary button/link in your app.
        indigo: {
          50: '#f0fdfa',  // Cyan-ish white
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf', // Bright Teal
          500: '#0d9488', // Deep Teal (Text)
          600: '#7c3aed', // 🟣 PRIMARY: Electric Violet (Buttons)
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // 🌑 New Dark Mode Backgrounds (Deep Space)
        dark: {
          bg: '#050505',
          card: '#0f0f11', // Almost black, slightly tinted
          border: '#27272a',
        },
      },
      backgroundImage: {
        // 🌈 The "Extraordinary" Gradient
        'brand-gradient': 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #db2777 100%)', // Cyan -> Violet -> Pink
        'nav-gradient': 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 100%)',
        'glass-shine': 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.5)', // Purple glow
        'neon': '0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(124, 58, 237, 0.3)',
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}