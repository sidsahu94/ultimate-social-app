/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme: Electric Blue & Royal Purple
        primary: {
          DEFAULT: '#2979FF', // Electric Blue
          glow: '#00E5FF',    // Neon Cyan Accent
        },
        secondary: {
          DEFAULT: '#7E57C2', // Royal Purple
        },
        // Ultra-Soft Backgrounds
        bg: {
          light: '#E0E5EC', // Classic Neumorphism Base
          dark: '#1A1B1E',  // Dark Neumorphism Base
        }
      },
      boxShadow: {
        // Neumorphism: Light Mode (Soft, Extruded)
        'neu-flat': '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
        'neu-pressed': 'inset 6px 6px 10px 0 rgba(163,177,198, 0.7), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
        
        // Neumorphism: Dark Mode (Deep, Sharp)
        'neu-dark-flat': '5px 5px 10px #0b0c0d, -5px -5px 10px #292a2f',
        'neu-dark-pressed': 'inset 5px 5px 10px #0b0c0d, inset -5px -5px 10px #292a2f',

        // Neon Glows
        'neon-blue': '0 0 10px #2979FF, 0 0 20px #2979FF',
        'neon-cyan': '0 0 10px #00E5FF, 0 0 20px #00E5FF',
      },
      fontFamily: {
        sans: ['"Exo 2"', 'Inter', 'sans-serif'], // Futuristic Font
      }
    },
  },
  plugins: [],
}